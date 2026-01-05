import { Test, TestingModule } from '@nestjs/testing';
import { KanbanService } from './kanban.service';
import { PrismaService } from 'src/database/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './kanban.dto';

const mockPrismaService = {
  kanban: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  kanban_columns: {
    findUnique: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    delete: jest.fn(),
  },
  kanban_tasks: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  users_tasks: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((callback) => callback(mockPrismaService)),
};

const mockProjectsService = {
  checkProjectPermission: jest.fn().mockResolvedValue(true),
};

const mockActorId = 'user-actor-id';
const mockProjectId = 'project-123';
const mockBoardId = 'board-123';
const mockColumnId = 'column-123';
const mockTaskId = 'task-123';
const mockMemberId = 'user-member-id';

const mockBoard = {
  id: mockBoardId,
  project_id: mockProjectId,
  name: 'Quadro Teste',
};

const mockColumn = {
  id: mockColumnId,
  kanban_id: mockBoardId,
  name: 'A Fazer',
  kanban: { project_id: mockProjectId },
};

const mockTask = {
  id: mockTaskId,
  column_id: mockColumnId,
  title: 'Nova Tarefa',
  kanban_columns: { kanban: { project_id: mockProjectId } },
};

describe('KanbanService', () => {
  let service: KanbanService;
  let prisma: PrismaService;
  let projectsService: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanbanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    }).compile();

    service = module.get<KanbanService>(KanbanService);
    prisma = module.get<PrismaService>(PrismaService);
    projectsService = module.get<ProjectsService>(ProjectsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBoardDetails', () => {
    it('should get board details if user is a member', async () => {
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(mockBoard);
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(mockBoard);

      const result = await service.getBoardDetails(mockBoardId, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider', 'membro']);
      expect(prisma.kanban.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockBoardId },
        }),
      );
      expect(result).toEqual(mockBoard);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(mockBoard);
      mockProjectsService.checkProjectPermission.mockRejectedValueOnce(new ForbiddenException());

      await expect(service.getBoardDetails(mockBoardId, 'wrong-user-id')).rejects.toThrow(ForbiddenException);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, 'wrong-user-id', ['lider', 'membro']);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(null);

      await expect(service.getBoardDetails(mockBoardId, mockActorId)).rejects.toThrow(NotFoundException);
      expect(projectsService.checkProjectPermission).not.toHaveBeenCalled();
    });
  });

  describe('createBoard', () => {
    it('should allow a leader to create a board', async () => {
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      mockPrismaService.kanban.create.mockResolvedValueOnce(mockBoard);

      const dto = { name: 'Quadro Teste' };
      await service.createBoard(dto, mockProjectId, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider']);
      expect(prisma.kanban.create).toHaveBeenCalled();
    });
  });

  describe('createTask', () => {
    it('should allow a member to create a task', async () => {
      mockPrismaService.kanban_columns.findUnique.mockResolvedValueOnce(mockColumn);
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      mockPrismaService.kanban_tasks.aggregate.mockResolvedValueOnce({ _max: { position: 1 } });
      mockPrismaService.kanban_tasks.create.mockResolvedValueOnce(mockTask);

      const dto: CreateTaskDto = { title: 'Nova Tarefa' };
      const result = await service.createTask(dto, mockColumnId, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider', 'membro']);
      expect(prisma.kanban_tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 2,
            created_by: mockActorId,
          }),
        }),
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe('assignTask', () => {
    it('should assign a user if actor and user are members', async () => {
      mockPrismaService.kanban_tasks.findUnique.mockResolvedValueOnce(mockTask);
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(true);
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(true); // <--- CORREÇÃO AQUI
      mockPrismaService.users_tasks.create.mockResolvedValueOnce({} as any);

      await service.assignTask(mockTaskId, { user_id: mockMemberId }, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledTimes(2);
      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider', 'membro']);
      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockMemberId, ['lider', 'membro']);
      expect(prisma.users_tasks.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user to assign is not a member', async () => {
      mockPrismaService.kanban_tasks.findUnique.mockResolvedValueOnce(mockTask);
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      mockProjectsService.checkProjectPermission.mockRejectedValueOnce(new ForbiddenException());

      const dto = { user_id: 'non-member-id' };
      await expect(service.assignTask(mockTaskId, dto, mockActorId)).rejects.toThrow(ForbiddenException);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledTimes(2);
      expect(prisma.users_tasks.create).not.toHaveBeenCalled();
    });
  });
});
