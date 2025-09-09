import { Controller, Get, Post, Body } from '@nestjs/common';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // POST /posts -> cria um post de teste
  @Post()
  async createPost(@Body('content') content: string) {
    return this.postService.createTestPost(content);
  }

  // GET /posts -> lista todos os posts
  @Get()
  async listPosts() {
    return this.postService.getAllPosts();
  }
}
