import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async checkProjectPermission(projectId: string, userId: string, allowedRoles: string[] = ['lider']) {
    const project = await this.prismaService.projects.findUnique({
      where: { id: projectId },
      select: { owner_user_id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    if (project.owner_user_id === userId) {
      return true;
    }

    const membership = await this.prismaService.project_members.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
      select: { role: true },
    });

    if (membership && membership.role && allowedRoles.includes(membership.role)) {
      return true;
    }

    throw new ForbiddenException('Você não tem permissão para executar esta ação.');
  }

  async create(data: CreateProjectDto, ownerId: string) {
    const { tag_ids, institution_id, course_id, ...projectData } = data;

    return this.prismaService.$transaction(async (tx) => {
      const project = await tx.projects.create({
        data: {
          ...projectData,
          users: { connect: { id: ownerId } }, 
          institutions: institution_id ? { connect: { id: institution_id } } : undefined,
          courses: course_id ? { connect: { id: course_id } } : undefined,
          project_tags: tag_ids
            ? {
                create: tag_ids.map((tagId) => ({
                  tags: { connect: { id: tagId } },
                })),
              }
            : undefined,
        },
      });

      await tx.project_members.create({
        data: {
          project_id: project.id,
          user_id: ownerId,
          role: 'lider',
        },
      });

      return project;
    });
  }

  async findMyProjects(userId: string) {
    return this.prismaService.projects.findMany({
      where: {
        project_members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        project_tags: { include: { tags: true } },
        project_members: { include: { users: { select: { name: true, avatar_url: true } } } },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prismaService.projects.findUnique({
      where: {
        id: projectId,
        OR: [{ visibility: 'public' }, { project_members: { some: { user_id: userId } } }],
      },
      include: {
        project_tags: { include: { tags: true } },
        project_members: { include: { users: { select: { name: true, avatar_url: true } } } },
        courses: true,
        institutions: true,
      },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project;
  }

  async update(projectId: string, data: UpdateProjectDto, userId: string) {
    await this.checkProjectPermission(projectId, userId, ['lider']);

    const { tag_ids, ...updateData } = data; 

    return await this.prismaService.projects.update({
      where: { id: projectId },
      data: {
        ...updateData,
        updated_at: new Date(), 
      },
    });
  }

  async remove(projectId: string, userId: string) {
    const project = await this.prismaService.projects.findUnique({
      where: { id: projectId },
      select: { owner_user_id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    if (project.owner_user_id !== userId) {
      throw new ForbiddenException('Apenas o dono original pode deletar o projeto.');
    }

    return this.prismaService.projects.delete({
      where: { id: projectId },
    });
  }

  async addMember(projectId: string, data: AddMemberDto, actorId: string) {
    await this.checkProjectPermission(projectId, actorId, ['lider']);

    return this.prismaService.project_members.create({
      data: {
        project_id: projectId,
        user_id: data.user_id,
        role: data.role,
      },
    });
  }

  async removeMember(projectId: string, memberUserId: string, actorId: string) {
    const [project, actorMembership] = await Promise.all([
      this.prismaService.projects.findUnique({
        where: { id: projectId },
        select: { owner_user_id: true },
      }),
      this.prismaService.project_members.findUnique({
        where: {
          project_id_user_id: { project_id: projectId, user_id: actorId },
        },
        select: { role: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    if (actorId === memberUserId) {
      if (project.owner_user_id === actorId) {
        throw new ForbiddenException('O dono não pode sair do projeto. Você pode apenas apagar o projeto.');
      }

      if (actorMembership?.role === 'lider') {
        throw new ForbiddenException('Líderes não podem sair do projeto. Peça para outro líder rebaixar sua permissão primeiro.');
      }

      return this.prismaService.project_members.delete({
        where: {
          project_id_user_id: { project_id: projectId, user_id: actorId },
        },
      });
    }

    await this.checkProjectPermission(projectId, actorId, ['lider']);

    if (project.owner_user_id === memberUserId) {
      throw new ForbiddenException('Você não pode remover o dono do projeto.');
    }

    return this.prismaService.project_members.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: memberUserId,
        },
      },
    });
  }
}
