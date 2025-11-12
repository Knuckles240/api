import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { OptionalAccessTokenGuard } from 'src/common/guards/optionalAccessToken.guard';

/**
 * Controller para gerenciar Posts.
 * Inclui rotas públicas (Vitrine) e rotas protegidas (Feed/Gestão).
 */
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // --- 1. Rota Pública (Vitrine) ---
  @UseGuards(OptionalAccessTokenGuard)
  @Get('vitrine')
  findPublicVitrine(@Req() req) {
    const userId = req.user?.id; 
    return this.postsService.findPublicVitrine(userId);
  }

  // --- 2. Rotas de Projeto (Feed Interno) ---

  @UseGuards(AccessTokenGuard)
  @Post('projects/:projectId/posts')
  createPost(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() createPostDto: CreatePostDto, @Req() req) {
    return this.postsService.create(createPostDto, req.user['id'], projectId);
  }

  @UseGuards(AccessTokenGuard)
  @Get('projects/:projectId/posts')
  findProjectPosts(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req) {
    return this.postsService.findForProject(projectId, req.user['id']);
  }

  // --- 3. Rotas de Post Específico (CRUD & Social) ---

  @UseGuards(AccessTokenGuard)
  @Get('posts/:id')
  findOnePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.findOne(id, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('posts/:id')
  updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() updatePostDto: UpdatePostDto, @Req() req) {
    return this.postsService.update(id, updatePostDto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('posts/:id')
  removePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.remove(id, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Post('posts/:id/like')
  toggleLikePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.toggleLike(id, req.user['id']);
  }
}
