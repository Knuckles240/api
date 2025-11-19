import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Helper para checar se um usuário tem permissão para editar/gerenciar um projeto.
   * Por enquanto, apenas 'lider' ou o dono original.
   */
  public async checkProjectPermission(projectId: string, userId: string, allowedRoles: string[] = ['lider']) {
    const project = await this.prismaService.projects.findUnique({
      where: { id: projectId },
      select: { owner_user_id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    // O dono original sempre tem permissão
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

  /**
   * Cria um novo projeto.
   * Usa uma transação para:
   * 1. Criar o projeto
   * 2. Conectar as tags (se houver)
   * 3. Adicionar o criador (owner) como 'lider' na tabela project_members
   */
  async create(data: CreateProjectDto, ownerId: string) {
    const { tag_ids, institution_id, course_id, ...projectData } = data;

    return this.prismaService.$transaction(async (tx) => {
      // 1. Cria o projeto
      const project = await tx.projects.create({
        data: {
          ...projectData,
          users: { connect: { id: ownerId } }, // CONECTA O DONO (owner_user_id)
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

      // 2. Adiciona o criador como 'lider'
      await tx.project_members.create({
        data: {
          project_id: project.id,
          user_id: ownerId,
          role: 'lider', // O criador é 'lider' por padrão
        },
      });

      return project;
    });
  }

  /**
   * Encontra todos os projetos dos quais um usuário é membro.
   */
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

  /**
   * Encontra um projeto específico.
   * Por enquanto, apenas checa se o usuário é membro para ver projetos privados.
   */
  async findOne(projectId: string, userId: string) {
    const project = await this.prismaService.projects.findUnique({
      where: { id: projectId },
      include: {
        project_tags: { include: { tags: true } },
        project_members: { include: { users: { select: { name: true, avatar_url: true } } } },
        courses: true,
        institutions: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    // Se o projeto for público, retorna direto
    if (project.visibility === 'public') {
      return project;
    }

    // Se for privado ou interno, checa se o usuário é membro
    const isMember = project.project_members.some((member) => member.user_id === userId);

    if (isMember) {
      return project;
    }

    // TODO: Adicionar lógica para 'internal' (checar se é da mesma instituição)

    throw new ForbiddenException('Você não tem permissão para ver este projeto.');
  }

  /**
   * Atualiza um projeto.
   * Apenas 'lider' ou o dono podem atualizar.
   */
  async update(projectId: string, data: UpdateProjectDto, userId: string) {
    await this.checkProjectPermission(projectId, userId, ['lider']);

    // Lógica para atualizar tags (desconectar antigas, conectar novas)
    // Por simplicidade, esta versão apenas atualiza dados simples.
    // A atualização de tags/membros é feita por rotas específicas.
    const { tag_ids, ...updateData } = data; // Ignora tag_ids por enquanto

    try {
      return await this.prismaService.projects.update({
        where: { id: projectId },
        data: {
          ...updateData,
          updated_at: new Date(), // Força a atualização do timestamp
        },
      });
    } catch (error) {
      throw new NotFoundException('Erro ao atualizar projeto.');
    }
  }

  /**
   * Remove um projeto.
   * Apenas o DONO ORIGINAL pode remover.
   */
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

    // O onDelete: Cascade no schema vai cuidar de limpar tabelas relacionadas
    return this.prismaService.projects.delete({
      where: { id: projectId },
    });
  }

  // --- Gerenciamento de Membros ---

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
    // Busca o projeto e o membro que está tentando sair
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

    // Caso 1: Usuário tentando sair do projeto (actorId === memberUserId)
    if (actorId === memberUserId) {
      // REGRA 1: O DONO não pode sair do próprio projeto.
      if (project.owner_user_id === actorId) {
        throw new ForbiddenException('O dono não pode sair do projeto. Você pode apenas apagar o projeto.');
      }

      // REGRA 2: Um LÍDER não pode sair do projeto (deve ser rebaixado ou outro líder promovido)
      if (actorMembership?.role === 'lider') {
        throw new ForbiddenException('Líderes não podem sair do projeto. Peça para outro líder rebaixar sua permissão primeiro.');
      }

      // Se for um membro comum, pode sair.
      return this.prismaService.project_members.delete({
        where: {
          project_id_user_id: { project_id: projectId, user_id: actorId },
        },
      });
    }

    // Caso 2: 'Lider' ou DONO removendo outro membro
    await this.checkProjectPermission(projectId, actorId, ['lider']);

    // REGRA 3: Ninguém pode remover o dono original, exceto o próprio dono (que é pego no Caso 1)
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
