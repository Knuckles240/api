import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from './projects.dto';
import { project_status_enum, visibility_enum } from '@prisma/client';

// Mock do nosso ProjectsService. Ele não terá lógica, só funções vazias (jest.fn()).
const mockProjectsService = {
  create: jest.fn(),
  findMyProjects: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
};

// Mock do nosso AccessTokenGuard. Vamos forçar ele a sempre "passar" (retornar true).
const mockAccessTokenGuard = {
  canActivate: jest.fn(() => true),
};

// Dados falsos que vamos usar nos testes
const mockUserId = 'mock-user-id';
const mockProjectId = 'mock-project-id';
const mockRequest = {
  user: {
    id: mockUserId,
  },
};

const mockProject = {
  id: mockProjectId,
  title: 'Projeto de Teste',
  owner_user_id: mockUserId,
  visibility: visibility_enum.public,
  status: project_status_enum.active,
  // ... outros campos do projeto
};

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    // Cria um módulo de teste "fake"
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService, // Usa o service mockado
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard) // Usa o guard mockado
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);

    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create (POST /projects)', () => {
    it('should create a new project', async () => {
      const createDto: CreateProjectDto = {
        title: 'Novo Projeto',
      };

      // Define o que o service.create deve retornar QUANDO for chamado
      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto, mockRequest);

      // Verifica se o controller chamou o service com os dados corretos
      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId);
      // Verifica se o controller retornou o que o service deu a ele
      expect(result).toEqual(mockProject);
    });
  });

  describe('findMyProjects (GET /projects/me)', () => {
    it('should return an array of projects for the user', async () => {
      const projects = [mockProject];
      mockProjectsService.findMyProjects.mockResolvedValue(projects);

      const result = await controller.findMyProjects(mockRequest);

      expect(service.findMyProjects).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(projects);
    });
  });

  describe('findOne (GET /projects/:id)', () => {
    it('should return a single project', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(mockProjectId, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(result).toEqual(mockProject);
    });
  });

  describe('update (PATCH /projects/:id)', () => {
    it('should update a project', async () => {
      const updateDto: UpdateProjectDto = { description: 'Nova descrição' };
      const updatedProject = { ...mockProject, ...updateDto };

      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(
        mockProjectId,
        updateDto,
        mockRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        mockProjectId,
        updateDto,
        mockUserId,
      );
      expect(result).toEqual(updatedProject);
    });
  });

  describe('remove (DELETE /projects/:id)', () => {
    it('should remove a project', async () => {
      // Funções de "delete" geralmente não retornam nada
      mockProjectsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockProjectId, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });
  });

  describe('addMember (POST /projects/:id/members)', () => {
    it('should add a member to the project', async () => {
      const addMemberDto: AddMemberDto = {
        user_id: 'new-member-id',
        role: 'membro',
      };
      const newMembership = {
        id: 'membership-id',
        ...addMemberDto,
        project_id: mockProjectId,
      };
      mockProjectsService.addMember.mockResolvedValue(newMembership);

      const result = await controller.addMember(
        mockProjectId,
        addMemberDto,
        mockRequest,
      );

      expect(service.addMember).toHaveBeenCalledWith(
        mockProjectId,
        addMemberDto,
        mockUserId,
      );
      expect(result).toEqual(newMembership);
    });
  });

  describe('removeMember (DELETE /projects/:id/members/:userId)', () => {
    it('should remove a member from the project', async () => {
      const memberToRemoveId = 'member-to-remove-id';
      mockProjectsService.removeMember.mockResolvedValue(undefined);

      await controller.removeMember(
        mockProjectId,
        memberToRemoveId,
        mockRequest,
      );

      expect(service.removeMember).toHaveBeenCalledWith(
        mockProjectId,
        memberToRemoveId,
        mockUserId,
      );
    });
  });
});