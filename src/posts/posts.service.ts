import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { like_target_type_enum, visibility_enum } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Helper para checar se um usuário é membro de um projeto.
   * Usado para ver posts privados/internos.
   */
  private async checkProjectMembership(projectId: string, userId: string) {
    const membership = await this.prismaService.project_members.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Você não tem permissão para ver este conteúdo.');
    }
    return membership;
  }

  /**
   * Helper para checar se um usuário é o autor de um post.
   * Usado para editar/deletar posts.
   */
  private async checkPostAuthorship(postId: string, userId: string) {
    const post = await this.prismaService.posts.findUnique({
      where: { id: postId },
      select: { author_id: true, projects: { select: { owner_user_id: true } } }, // Inclui o dono do projeto
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }

    // Permite se o usuário for o autor do post OU o dono do projeto
    if (post.author_id !== userId && post.projects?.owner_user_id !== userId) {
      // TODO: Permitir que 'lider' do projeto também edite/delete
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    return post;
  }

  // --- Funções Principais ---

  /**
   * (Vitrine) Retorna todos os posts públicos.
   * Não requer autenticação.
   */
  async findPublicVitrine(userId?: string) {
    return this.prismaService.posts.findMany({
      where: { visibility: visibility_enum.public },
      include: {
        users: {
          select: { name: true, avatar_url: true },
        },
        projects: {
          select: { title: true, file_url: true },
        },
        post_tags: {
          include: { tags: { select: { name: true } } },
        },
        user_likes: userId 
          ? {
              where: {
                user_id: userId,
              },
              select: {
                id: true,
              },
            }
          : undefined,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50, // Adiciona paginação básica
    });
  }

  /**
   * (Feed do Projeto) Retorna todos os posts de um projeto específico.
   * Requer que o usuário seja membro do projeto.
   */
  async findForProject(projectId: string, userId: string) {
    // Garante que o usuário logado é membro do projeto
    await this.checkProjectMembership(projectId, userId);

    return this.prismaService.posts.findMany({
      where: { project_id: projectId },
      include: {
        users: {
          // Autor do post
          select: { id: true, name: true, avatar_url: true },
        },
        post_tags: {
          include: { tags: { select: { name: true } } },
        },
        user_likes: {
          where: {
            user_id: userId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * (Visualização) Retorna um post específico.
   * Checa permissão (público ou membro).
   */
  async findOne(postId: string, userId: string) {
    const post = await this.prismaService.posts.findUnique({
      where: { id: postId },
      include: {
        users: { select: { name: true, avatar_url: true } },
        projects: { select: { title: true } },
        user_likes: {
          where: {
            user_id: userId,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }

    // Se for público, retorna direto
    if (post.visibility === visibility_enum.public) {
      return post;
    }

    // Se for privado/interno, checa se o usuário é membro do projeto
    if (!post.project_id) {
      throw new NotFoundException('Post órfão não pode ser acessado.');
    }
    await this.checkProjectMembership(post.project_id, userId);
    return post;
  }

  /**
   * (Criação) Cria um novo post dentro de um projeto.
   * Requer que o autor seja membro do projeto.
   */
  async create(dto: CreatePostDto, authorId: string, projectId: string) {
    // Garante que o autor é membro do projeto
    await this.checkProjectMembership(projectId, authorId);

    const { tag_ids, ...postData } = dto;

    return this.prismaService.posts.create({
      data: {
        ...postData,
        author_id: authorId,
        project_id: projectId,
        post_tags: tag_ids
          ? {
              create: tag_ids.map((tagId) => ({
                tags: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * (Edição) Atualiza um post.
   * Requer que o usuário seja o autor do post ou dono do projeto.
   */
  async update(postId: string, dto: UpdatePostDto, userId: string) {
    // Garante que o usuário é o autor ou dono
    await this.checkPostAuthorship(postId, userId);

    const { tag_ids, ...updateData } = dto;
    // TODO: Adicionar lógica para atualizar tags (desconectar/conectar)

    return this.prismaService.posts.update({
      where: { id: postId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });
  }

  /**
   * (Deleção) Remove um post.
   * Requer que o usuário seja o autor do post ou dono do projeto.
   */
  async remove(postId: string, userId: string) {
    // Garante que o usuário é o autor ou dono
    await this.checkPostAuthorship(postId, userId);

    return this.prismaService.posts.delete({
      where: { id: postId },
    });
  }

  /**
   * (Social) Curte ou Descurte um post.
   * Executa uma transação para garantir consistência.
   * 1. Checa se o usuário pode ver o post.
   * 2. Checa se o like já existe.
   * 3. Se existe: Deleta o like e decrementa o like_count.
   * 4. Se não existe: Cria o like e incrementa o like_count.
   */
  async toggleLike(postId: string, userId: string) {
    // 1. Garante que o usuário pode ver o post (e que o post existe)
    await this.findOne(postId, userId);

    // 2. Checa se o like já existe
    const existingLike = await this.prismaService.user_likes.findUnique({
      where: {
        user_id_target_id: {
          user_id: userId,
          target_id: postId,
        },
      },
    });

    return this.prismaService.$transaction(async (tx) => {
      if (existingLike) {
        // --- 3. SE EXISTE: DESCURTIR ---

        // Deleta o registro do like
        await tx.user_likes.delete({
          where: { id: existingLike.id },
        });

        // Decrementa o contador no post
        const updatedPost = await tx.posts.update({
          where: { id: postId },
          data: {
            like_count: { decrement: 1 },
          },
        });

        return { liked: false, likeCount: updatedPost.like_count };
      } else {
        // --- 4. SE NÃO EXISTE: CURTIR ---

        // Cria o registro do like
        await tx.user_likes.create({
          data: {
            user_id: userId,
            target_id: postId,
            target_type: like_target_type_enum.post,
          },
        });

        // Incrementa o contador no post
        const updatedPost = await tx.posts.update({
          where: { id: postId },
          data: {
            like_count: { increment: 1 },
          },
        });

        return { liked: true, likeCount: updatedPost.like_count };
      }
    });
  }
}
