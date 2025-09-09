import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PrismaService } from './database/prisma.service';
import { PostController } from './post.controller';

@Module({
  controllers: [PostController],
  providers: [PrismaService, PostService],
})
export class PostModule {}
