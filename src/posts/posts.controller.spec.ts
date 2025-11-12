import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { visibility_enum } from '@prisma/client';

// Mock do PostsService
const mockPostsService = {
  findPublicVitrine: jest.fn(),
  create: jest.fn(),
  findForProject: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  toggleLike: jest.fn(), // <- CORRIGIDO DE 'like' PARA 'toggleLike'
};

// Mock do AccessTokenGuard
const mockAccessTokenGuard = {
  canActivate: jest.fn(() => true),
};

// Dados Falsos para Testes
const mockUserId = 'mock-user-id';
const mockProjectId = 'mock-project-id';
const mockPostId = 'mock-post-id';
const mockRequest = {
  user: {
    id: mockUserId,
  },
};

const mockPost = {
  id: mockPostId,
  content_md: 'Este é um post de teste',
  author_id: mockUserId,
  project_id: mockProjectId,
  visibility: visibility_enum.public,
  like_count: 0,
  created_at: new Date(),
};

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService, // Usa o service mockado
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard) // Usa o guard mockado
      .compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findPublicVitrine (GET /vitrine)', () => {
    it('should return an array of public posts', async () => {
      mockPostsService.findPublicVitrine.mockResolvedValue([mockPost]);

      const result = await controller.findPublicVitrine(mockUserId);

      expect(service.findPublicVitrine).toHaveBeenCalled();
      expect(result).toEqual([mockPost]);
    });
  });

  describe('createPost (POST /projects/:projectId/posts)', () => {
    it('should create a new post for a project', async () => {
      const createDto: CreatePostDto = { content_md: 'Novo post' };
      mockPostsService.create.mockResolvedValue(mockPost);

      const result = await controller.createPost(mockProjectId, createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId, mockProjectId);
      expect(result).toEqual(mockPost);
    });
  });

  describe('findProjectPosts (GET /projects/:projectId/posts)', () => {
    it('should return posts for a specific project', async () => {
      mockPostsService.findForProject.mockResolvedValue([mockPost]);

      const result = await controller.findProjectPosts(mockProjectId, mockRequest);

      expect(service.findForProject).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(result).toEqual([mockPost]);
    });
  });

  describe('findOnePost (GET /posts/:id)', () => {
    it('should return a single post', async () => {
      mockPostsService.findOne.mockResolvedValue(mockPost);

      const result = await controller.findOnePost(mockPostId, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(result).toEqual(mockPost);
    });
  });

  describe('updatePost (PATCH /posts/:id)', () => {
    it('should update a post', async () => {
      const updateDto: UpdatePostDto = { content_md: 'Conteúdo atualizado' };
      const updatedPost = { ...mockPost, ...updateDto };
      mockPostsService.update.mockResolvedValue(updatedPost);

      const result = await controller.updatePost(mockPostId, updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(mockPostId, updateDto, mockUserId);
      expect(result).toEqual(updatedPost);
    });
  });

  describe('removePost (DELETE /posts/:id)', () => {
    it('should remove a post', async () => {
      mockPostsService.remove.mockResolvedValue(undefined); // Delete não retorna nada

      await controller.removePost(mockPostId, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockPostId, mockUserId);
    });
  });

  // --- TESTE CORRIGIDO PARA TOGGLE LIKE ---
  describe('toggleLikePost (POST /posts/:id/like)', () => {
    it('should like a post and return the new status', async () => {
      const likeResponse = { liked: true, likeCount: 1 };
      mockPostsService.toggleLike.mockResolvedValue(likeResponse);

      const result = await controller.toggleLikePost(mockPostId, mockRequest);

      expect(service.toggleLike).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(result).toEqual(likeResponse);
    });

    it('should unlike a post and return the new status', async () => {
      const unlikeResponse = { liked: false, likeCount: 0 };
      mockPostsService.toggleLike.mockResolvedValue(unlikeResponse);

      const result = await controller.toggleLikePost(mockPostId, mockRequest);

      expect(service.toggleLike).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(result).toEqual(unlikeResponse);
    });
  });
});
