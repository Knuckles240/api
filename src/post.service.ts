import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service'; // ajuste o caminho conforme seu projeto
import { randomUUID } from 'crypto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria o primeiro usuário se não existir e já cria um post
  async createTestPost(content: string) {
    // cria usuário de teste se não houver nenhum
    let user = await this.prisma.users.findFirst();
    if (!user) {
      user = await this.prisma.users.create({
        data: {
          id: randomUUID(), // gera UUID válido
          full_name: 'Primeiro Usuário',
          email: 'primeiro@teste.com',
          password_hash: '123456',
          role: 'student',
        },
      });
    }

    // cria um post vinculado ao usuário
    const post = await this.prisma.posts.create({
      data: {
        author_id: user.id,
        content_md: content,
      },
    });

    return post;
  }

  // Lista todos os posts
  async getAllPosts() {
    return this.prisma.posts.findMany({
      orderBy: { created_at: 'desc' },
    });
  }
}
