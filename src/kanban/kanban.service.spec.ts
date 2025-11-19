import { Test, TestingModule } from '@nestjs/testing';
import { KanbanService } from './kanban.service';
import { PrismaService } from 'src/database/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './kanban.dto';

// Mock do PrismaService
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

// Mock do ProjectsService (a dependência injetada)
const mockProjectsService = {
  // A função de permissão não retorna nada em caso de sucesso, apenas não dá erro
  checkProjectPermission: jest.fn().mockResolvedValue(undefined),
};

// --- Dados Mockados ---
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
        { provide: ProjectsService, useValue: mockProjectsService }, // Fornece o mock
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

  // --- Testes de Permissão (Helpers) ---
  // Vamos testar um método que usa os helpers, como getBoardDetails

  describe('getBoardDetails', () => {
    it('should get board details if user is a member', async () => {
      // 1. Mock para o helper getProjectIdFromBoard
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(mockBoard);
      // 2. Mock para checkProjectPermission (sucesso)
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      // 3. Mock para o findUnique principal do método
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
      // 1. Mock para o helper
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(mockBoard);
      // 2. Mock para checkProjectPermission (falha)
      mockProjectsService.checkProjectPermission.mockRejectedValueOnce(new ForbiddenException());

      await expect(service.getBoardDetails(mockBoardId, 'wrong-user-id')).rejects.toThrow(ForbiddenException);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, 'wrong-user-id', ['lider', 'membro']);
    });

    it('should throw NotFoundException if board does not exist', async () => {
      // 1. Mock para o helper (não encontra o quadro)
      mockPrismaService.kanban.findUnique.mockResolvedValueOnce(null);

      await expect(service.getBoardDetails(mockBoardId, mockActorId)).rejects.toThrow(NotFoundException);
      expect(projectsService.checkProjectPermission).not.toHaveBeenCalled();
    });
  });

  // --- Testes de Nível de Permissão (Líder vs Membro) ---

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
      // 1. Helper getProjectIdFromColumn
      mockPrismaService.kanban_columns.findUnique.mockResolvedValueOnce(mockColumn);
      // 2. checkProjectPermission
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      // 3. aggregate
      mockPrismaService.kanban_tasks.aggregate.mockResolvedValueOnce({ _max: { position: 1 } });
      // 4. create
      mockPrismaService.kanban_tasks.create.mockResolvedValueOnce(mockTask);

      const dto: CreateTaskDto = { title: 'Nova Tarefa' };
      const result = await service.createTask(dto, mockColumnId, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider', 'membro']);
      expect(prisma.kanban_tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 2, // 1 (max) + 1
            created_by: mockActorId,
          }),
        }),
      );
      expect(result).toEqual(mockTask);
    });
  });

  // --- Teste de Lógica Complexa (AssignTask) ---

  describe('assignTask', () => {
    it('should assign a user if actor and user are members', async () => {
      // 1. Helper getProjectIdFromTask
      mockPrismaService.kanban_tasks.findUnique.mockResolvedValueOnce(mockTask);
      // 2. checkProjectPermission (actor)
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      // 3. checkProjectPermission (user to be assigned)
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      // 4. create users_tasks
      mockPrismaService.users_tasks.create.mockResolvedValueOnce({} as any);

      await service.assignTask(mockTaskId, { user_id: mockMemberId }, mockActorId);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledTimes(2);
      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockActorId, ['lider', 'membro']);
      expect(projectsService.checkProjectPermission).toHaveBeenCalledWith(mockProjectId, mockMemberId, ['lider', 'membro']);
      expect(prisma.users_tasks.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user to assign is not a member', async () => {
      // 1. Helper
      mockPrismaService.kanban_tasks.findUnique.mockResolvedValueOnce(mockTask);
      // 2. checkProjectPermission (actor) - SUCESSO
      mockProjectsService.checkProjectPermission.mockResolvedValueOnce(undefined);
      // 3. checkProjectPermission (user to be assigned) - FALHA
      mockProjectsService.checkProjectPermission.mockRejectedValueOnce(new ForbiddenException());

      const dto = { user_id: 'non-member-id' };
      await expect(service.assignTask(mockTaskId, dto, mockActorId)).rejects.toThrow(ForbiddenException);

      expect(projectsService.checkProjectPermission).toHaveBeenCalledTimes(2);
      expect(prisma.users_tasks.create).not.toHaveBeenCalled();
    });
  });
});