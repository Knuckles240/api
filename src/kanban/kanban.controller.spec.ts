import { Test, TestingModule } from '@nestjs/testing';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreateKanbanBoardDto, AssignTaskDto, MoveTaskDto } from './kanban.dto';

// Mock do KanbanService
const mockKanbanService = {
  createBoard: jest.fn(),
  getProjectBoards: jest.fn(),
  getBoardDetails: jest.fn(),
  updateBoard: jest.fn(),
  deleteBoard: jest.fn(),
  createColumn: jest.fn(),
  updateColumn: jest.fn(),
  deleteColumn: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  moveTask: jest.fn(),
  assignTask: jest.fn(),
  unassignTask: jest.fn(),
};

// Mock do Guard
const mockAccessTokenGuard = {
  canActivate: jest.fn(() => true),
};

// --- Dados Mockados ---
const mockActorId = 'user-actor-id';
const mockProjectId = 'project-123';
const mockBoardId = 'board-123';
const mockColumnId = 'column-123';
const mockTaskId = 'task-123';
const mockUserId = 'user-123';

const mockRequest = {
  user: {
    id: mockActorId,
  },
};

const mockBoard = { id: mockBoardId, name: 'Quadro Teste', project_id: mockProjectId };

describe('KanbanController', () => {
  let controller: KanbanController;
  let service: KanbanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KanbanController],
      providers: [{ provide: KanbanService, useValue: mockKanbanService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard)
      .compile();

    controller = module.get<KanbanController>(KanbanController);
    service = module.get<KanbanService>(KanbanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Testes de Board ---
  describe('createBoard', () => {
    it('should call service.createBoard with correct params', async () => {
      const dto: CreateKanbanBoardDto = { name: 'Novo Quadro' };
      mockKanbanService.createBoard.mockResolvedValue(mockBoard);

      const result = await controller.createBoard(mockProjectId, dto, mockRequest);

      expect(service.createBoard).toHaveBeenCalledWith(dto, mockProjectId, mockActorId);
      expect(result).toEqual(mockBoard);
    });
  });

  describe('getProjectBoards', () => {
    it('should call service.getProjectBoards', async () => {
      mockKanbanService.getProjectBoards.mockResolvedValue([mockBoard]);

      await controller.getProjectBoards(mockProjectId, mockRequest);

      expect(service.getProjectBoards).toHaveBeenCalledWith(mockProjectId, mockActorId);
    });
  });

  describe('getBoardDetails', () => {
    it('should call service.getBoardDetails', async () => {
      mockKanbanService.getBoardDetails.mockResolvedValue(mockBoard);

      await controller.getBoardDetails(mockBoardId, mockRequest);

      expect(service.getBoardDetails).toHaveBeenCalledWith(mockBoardId, mockActorId);
    });
  });

  // --- Testes de Coluna ---
  describe('createColumn', () => {
    it('should call service.createColumn', async () => {
      const dto = { name: 'Nova Coluna' };
      mockKanbanService.createColumn.mockResolvedValue({} as any);

      await controller.createColumn(mockBoardId, dto, mockRequest);

      expect(service.createColumn).toHaveBeenCalledWith(dto, mockBoardId, mockActorId);
    });
  });

  // --- Testes de Tarefa ---
  describe('createTask', () => {
    it('should call service.createTask', async () => {
      const dto = { title: 'Nova Tarefa' };
      mockKanbanService.createTask.mockResolvedValue({} as any);

      await controller.createTask(mockColumnId, dto, mockRequest);

      expect(service.createTask).toHaveBeenCalledWith(dto, mockColumnId, mockActorId);
    });
  });

  describe('deleteTask', () => {
    it('should call service.deleteTask', async () => {
      mockKanbanService.deleteTask.mockResolvedValue(undefined);

      await controller.deleteTask(mockTaskId, mockRequest);

      expect(service.deleteTask).toHaveBeenCalledWith(mockTaskId, mockActorId);
    });
  });

  // --- Testes de Ações ---
  describe('moveTask', () => {
    it('should call service.moveTask', async () => {
      const dto: MoveTaskDto = { new_column_id: 'col-2', new_position: 0 };
      mockKanbanService.moveTask.mockResolvedValue({} as any);

      await controller.moveTask(mockTaskId, dto, mockRequest);

      expect(service.moveTask).toHaveBeenCalledWith(mockTaskId, dto, mockActorId);
    });
  });

  describe('assignTask', () => {
    it('should call service.assignTask', async () => {
      const dto: AssignTaskDto = { user_id: mockUserId };
      mockKanbanService.assignTask.mockResolvedValue({} as any);

      await controller.assignTask(mockTaskId, dto, mockRequest);

      expect(service.assignTask).toHaveBeenCalledWith(mockTaskId, dto, mockActorId);
    });
  });

  describe('unassignTask', () => {
    it('should call service.unassignTask', async () => {
      mockKanbanService.unassignTask.mockResolvedValue(undefined);

      await controller.unassignTask(mockTaskId, mockUserId, mockRequest);

      expect(service.unassignTask).toHaveBeenCalledWith(mockTaskId, mockUserId, mockActorId);
    });
  });
});