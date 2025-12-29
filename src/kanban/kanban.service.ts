import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import {
  AssignTaskDto,
  CreateColumnDto,
  CreateKanbanBoardDto,
  CreateTaskDto,
  MoveTaskDto,
  UpdateColumnDto,
  UpdateKanbanBoardDto,
  UpdateTaskDto,
} from './kanban.dto';

@Injectable()
export class KanbanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * Encontra o project_id de um quadro Kanban
   */
  private async getProjectIdFromBoard(boardId: string) {
    const board = await this.prisma.kanban.findUnique({
      where: { id: boardId },
      select: { project_id: true },
    });
    if (!board?.project_id) {
      throw new NotFoundException('Quadro Kanban não encontrado ou não associado a um projeto.');
    }
    return board.project_id;
  }

  /**
   * Encontra o project_id a partir de uma coluna
   */
  private async getProjectIdFromColumn(columnId: string) {
    const column = await this.prisma.kanban_columns.findUnique({
      where: { id: columnId },
      select: { kanban: { select: { project_id: true } } },
    });
    if (!column?.kanban?.project_id) {
      throw new NotFoundException('Coluna não encontrada ou não associada a um projeto.');
    }
    return column.kanban.project_id;
  }

  /**
   * Encontra o project_id a partir de uma tarefa
   */
  private async getProjectIdFromTask(taskId: string) {
    const task = await this.prisma.kanban_tasks.findUnique({
      where: { id: taskId },
      select: { kanban_columns: { select: { kanban: { select: { project_id: true } } } } },
    });
    if (!task?.kanban_columns?.kanban?.project_id) {
      throw new NotFoundException('Tarefa não encontrada ou não associada a um projeto.');
    }
    return task.kanban_columns.kanban.project_id;
  }

  // --- Quadros (Boards) ---
  async createBoard(dto: CreateKanbanBoardDto, projectId: string, actorId: string) {
    // Apenas líderes podem criar/editar quadros
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    return this.prisma.kanban.create({
      data: {
        ...dto,
        project_id: projectId,
      },
    });
  }

  async getProjectBoards(projectId: string, actorId: string) {
    // Membros podem visualizar quadros
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    return this.prisma.kanban.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'asc' },
    });
  }

  async getBoardDetails(boardId: string, actorId: string) {
    const projectId = await this.getProjectIdFromBoard(boardId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    return this.prisma.kanban.findUnique({
      where: { id: boardId },
      include: {
        kanban_columns: {
          orderBy: { position: 'asc' },
          include: {
            kanban_tasks: {
              orderBy: { position: 'asc' },
              include: {
                users_tasks: {
                  include: {
                    users: {
                      select: { id: true, name: true, avatar_url: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateBoard(boardId: string, dto: UpdateKanbanBoardDto, actorId: string) {
    const projectId = await this.getProjectIdFromBoard(boardId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    return this.prisma.kanban.update({
      where: { id: boardId },
      data: dto,
    });
  }

  async deleteBoard(boardId: string, actorId: string) {
    const projectId = await this.getProjectIdFromBoard(boardId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    // O schema (onDelete: Cascade) cuidará de deletar colunas e tarefas
    return this.prisma.kanban.delete({
      where: { id: boardId },
    });
  }

  // --- Colunas (Columns) ---
  async createColumn(dto: CreateColumnDto, boardId: string, actorId: string) {
    const projectId = await this.getProjectIdFromBoard(boardId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    // Encontra a maior posição atual para adicionar no final
    const maxPos = await this.prisma.kanban_columns.aggregate({
      where: { kanban_id: boardId },
      _max: { position: true },
    });

    const newPosition = maxPos._max.position === null ? 0 : maxPos._max.position + 1;

    return this.prisma.kanban_columns.create({
      data: {
        ...dto,
        kanban_id: boardId,
        position: newPosition,
      },
    });
  }

  async updateColumn(columnId: string, dto: UpdateColumnDto, actorId: string) {
    const projectId = await this.getProjectIdFromColumn(columnId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    return this.prisma.kanban_columns.update({
      where: { id: columnId },
      data: dto,
    });
  }

  async deleteColumn(columnId: string, actorId: string) {
    const projectId = await this.getProjectIdFromColumn(columnId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider']);

    // O schema (onDelete: NoAction) na tarefa pode causar erro.
    // Vamos deletar as tarefas da coluna primeiro.
    return this.prisma.$transaction(async (tx) => {
      await tx.kanban_tasks.deleteMany({
        where: { column_id: columnId },
      });
      return tx.kanban_columns.delete({
        where: { id: columnId },
      });
    });
  }

  // --- Tarefas (Tasks) ---
  async createTask(dto: CreateTaskDto, columnId: string, actorId: string) {
    const projectId = await this.getProjectIdFromColumn(columnId);
    // Membros podem criar tarefas
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    const maxPos = await this.prisma.kanban_tasks.aggregate({
      where: { column_id: columnId },
      _max: { position: true },
    });

    const newPosition = maxPos._max.position === null ? 0 : maxPos._max.position + 1;

    return this.prisma.kanban_tasks.create({
      data: {
        ...dto,
        column_id: columnId,
        created_by: actorId,
        position: newPosition,
      },
    });
  }

  async updateTask(taskId: string, dto: UpdateTaskDto, actorId: string) {
    const projectId = await this.getProjectIdFromTask(taskId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    return this.prisma.kanban_tasks.update({
      where: { id: taskId },
      data: dto,
    });
  }

  async moveTask(taskId: string, dto: MoveTaskDto, actorId: string) {
    const projectId = await this.getProjectIdFromTask(taskId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    // TODO: Implementar lógica transacional complexa para reordenar
    // Por enquanto, apenas movemos
    return this.prisma.kanban_tasks.update({
      where: { id: taskId },
      data: {
        column_id: dto.new_column_id,
        position: dto.new_position,
      },
    });
  }

  async deleteTask(taskId: string, actorId: string) {
    const projectId = await this.getProjectIdFromTask(taskId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    // O schema (onDelete: Cascade) em users_tasks cuidará dos assignees
    return this.prisma.kanban_tasks.delete({
      where: { id: taskId },
    });
  }

  // --- Assignees (users_tasks) ---
  async assignTask(taskId: string, dto: AssignTaskDto, actorId: string) {
    const projectId = await this.getProjectIdFromTask(taskId);
    // 1. Verifica se o ator (quem assigna) é membro
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    // 2. Verifica se o usuário (quem é assignado) também é membro
    const permission = await this.projectsService.checkProjectPermission(projectId, dto.user_id, ['lider', 'membro']);
    if (!permission) throw new ForbiddenException('Não é possível assignar um usuário que não é membro do projeto.');

    return this.prisma.users_tasks.create({
      data: {
        task_id: taskId,
        user_id: dto.user_id,
      },
    });
  }

  async unassignTask(taskId: string, userId: string, actorId: string) {
    const projectId = await this.getProjectIdFromTask(taskId);
    await this.projectsService.checkProjectPermission(projectId, actorId, ['lider', 'membro']);

    return this.prisma.users_tasks.delete({
      where: {
        user_id_task_id: {
          user_id: userId,
          task_id: taskId,
        },
      },
    });
  }
}
