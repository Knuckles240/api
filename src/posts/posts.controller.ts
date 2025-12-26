import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { OptionalAccessTokenGuard } from 'src/common/guards/optionalAccessToken.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(OptionalAccessTokenGuard)
  @Get('vitrine')
  @ApiOperation({ summary: 'Vê a vitrine.' })
  findPublicVitrine(@Req() req) {
    const userId = req.user?.id;
    return this.postsService.findPublicVitrine(userId);
  }
  
  @UseGuards(AccessTokenGuard)
  @Post('projects/:projectId/posts')
  @ApiOperation({ summary: 'Cria um novo post associado a um projeto.' })
  createPost(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() createPostDto: CreatePostDto, @Req() req) {
    return this.postsService.create(createPostDto, req.user['id'], projectId);
  }
  
  @UseGuards(AccessTokenGuard)
  @Get('projects/:projectId/posts')
  @ApiOperation({ summary: 'Retorno os post associados a um projeto.' })
  findProjectPosts(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req) {
    return this.postsService.findForProject(projectId, req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Get('posts/:id')
  @ApiOperation({ summary: 'Retorno um post com base em seu ID.' })
  findOnePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.findOne(id, req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Patch('posts/:id')
  @ApiOperation({ summary: 'Edita as informações de um post.' })
  updatePost(@Param('id', ParseUUIDPipe) id: string, @Body() updatePostDto: UpdatePostDto, @Req() req) {
    return this.postsService.update(id, updatePostDto, req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Delete('posts/:id')
  @ApiOperation({ summary: 'Deleta o registro de um post.' })
  removePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.remove(id, req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Dá like/deslike em um post.' })
  toggleLikePost(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.postsService.toggleLike(id, req.user['id']);
  }
}
