import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { like_target_type_enum, visibility_enum } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prismaService: PrismaService) {}

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

  private async checkPostAuthorship(postId: string, userId: string) {
    const post = await this.prismaService.posts.findUnique({
      where: { id: postId },
      select: { author_id: true, projects: { select: { owner_user_id: true } } },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado.');
    }

    if (post.author_id !== userId && post.projects?.owner_user_id !== userId) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    return post;
  }

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
      take: 50,
    });
  }

  async findForProject(projectId: string, userId: string) {
    await this.checkProjectMembership(projectId, userId);

    return this.prismaService.posts.findMany({
      where: { project_id: projectId },
      include: {
        users: {
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

    if (post.visibility === visibility_enum.public) {
      return post;
    }

    if (!post.project_id) {
      throw new NotFoundException('Post órfão não pode ser acessado.');
    }
    await this.checkProjectMembership(post.project_id, userId);
    return post;
  }

  async create(dto: CreatePostDto, authorId: string, projectId: string) {
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

  async update(postId: string, dto: UpdatePostDto, userId: string) {
    await this.checkPostAuthorship(postId, userId);

    const { tag_ids, ...updateData } = dto;
    return this.prismaService.posts.update({
      where: { id: postId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });
  }

  async remove(postId: string, userId: string) {
    await this.checkPostAuthorship(postId, userId);

    return this.prismaService.posts.delete({
      where: { id: postId },
    });
  }

  async toggleLike(postId: string, userId: string) {
    await this.findOne(postId, userId);

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
        await tx.user_likes.delete({
          where: { id: existingLike.id },
        });

        const updatedPost = await tx.posts.update({
          where: { id: postId },
          data: {
            like_count: { decrement: 1 },
          },
        });

        return { liked: false, likeCount: updatedPost.like_count };
      } else {
        await tx.user_likes.create({
          data: {
            user_id: userId,
            target_id: postId,
            target_type: like_target_type_enum.post,
          },
        });

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
