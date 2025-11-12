import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from 'src/database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  like_target_type_enum, // Importar o enum
  visibility_enum,
} from '@prisma/client';
import { CreatePostDto, UpdatePostDto } from './posts.dto';

// Mock do PrismaService com a nova tabela user_likes e $transaction
const mockPrismaService = {
  project_members: {
    findUnique: jest.fn(),
  },
  posts: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Adiciona o mock para a nova tabela
  user_likes: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  // Mocka a transação para apenas executar o callback
  $transaction: jest.fn().mockImplementation((callback) => {
    // Passamos o próprio mockPrismaService como o cliente transacional (tx)
    return callback(mockPrismaService);
  }),
};

// Dados Falsos para Testes
const mockUserId = 'user-123';
const mockProjectId = 'project-abc';
const mockPostId = 'post-xyz';

const mockMembership = {
  project_id: mockProjectId,
  user_id: mockUserId,
  role: 'lider',
};

const mockPost = {
  id: mockPostId,
  content_md: 'Este é um post de teste',
  author_id: mockUserId,
  project_id: mockProjectId,
  visibility: visibility_enum.public,
  like_count: 0,
  projects: { owner_user_id: 'owner-id' },
};

const mockPostPrivate = {
  ...mockPost,
  visibility: visibility_enum.private,
};

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ... (testes de findPublicVitrine, findForProject, findOne, create, update, remove) ...
  // (O teste de findOne já está no seu arquivo e é necessário para o toggleLike)

  describe('findOne', () => {
    it('should return a public post to any user', async () => {
      mockPrismaService.posts.findUnique.mockResolvedValue(mockPost);
      const result = await service.findOne(mockPostId, 'any-user-id');
      expect(result).toEqual(mockPost);
    });

    it('should return a private post if user is a member', async () => {
      mockPrismaService.posts.findUnique.mockResolvedValue(mockPostPrivate);
      mockPrismaService.project_members.findUnique.mockResolvedValue(
        mockMembership,
      );

      const result = await service.findOne(mockPostId, mockUserId);
      expect(result).toEqual(mockPostPrivate);
    });
  });

  // --- TESTE CORRIGIDO PARA TOGGLE LIKE ---
  describe('toggleLike', () => {
    // Usamos spyOn para mockar a chamada findOne DENTRO do próprio service
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      // Garantimos que a checagem interna 'this.findOne()' sempre passe
      // para podermos testar a lógica de like/unlike
      findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockPost as any);
    });

    afterEach(() => {
      findOneSpy.mockRestore(); // Limpa o spy
    });

    it('should LIKE a post if no like exists', async () => {
      // 1. findOne é mockado pelo spyOn
      // 2. Mocka o 'existingLike' (não acha nada)
      mockPrismaService.user_likes.findUnique.mockResolvedValue(null);
      // 3. Mocka a transação (já mockada no setup)
      // 4. Mocka o create (não precisamos do retorno dele)
      // 5. Mocka o update do post (retorna o post com +1 like)
      const updatedPost = { ...mockPost, like_count: 1 };
      mockPrismaService.posts.update.mockResolvedValue(updatedPost);

      const result = await service.toggleLike(mockPostId, mockUserId);

      expect(service.findOne).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(prisma.user_likes.findUnique).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user_likes.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUserId,
          target_id: mockPostId,
          target_type: like_target_type_enum.post,
        },
      });
      expect(prisma.posts.update).toHaveBeenCalledWith({
        where: { id: mockPostId },
        data: { like_count: { increment: 1 } },
      });
      expect(result).toEqual({ liked: true, likeCount: 1 });
    });

    it('should UNLIKE a post if a like exists', async () => {
      const mockLike = {
        id: 'like-123',
        user_id: mockUserId,
        target_id: mockPostId,
      };
      // 1. findOne é mockado pelo spyOn
      // 2. Mocka o 'existingLike' (acha um like)
      mockPrismaService.user_likes.findUnique.mockResolvedValue(mockLike);
      // 3. Mocka a transação
      // 4. Mocka o delete
      // 5. Mocka o update do post (retorna o post com -1 like)
      const updatedPost = { ...mockPost, like_count: 0 };
      mockPrismaService.posts.update.mockResolvedValue(updatedPost);

      const result = await service.toggleLike(mockPostId, mockUserId);

      expect(service.findOne).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(prisma.user_likes.findUnique).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user_likes.delete).toHaveBeenCalledWith({
        where: { id: mockLike.id },
      });
      expect(prisma.posts.update).toHaveBeenCalledWith({
        where: { id: mockPostId },
        data: { like_count: { decrement: 1 } },
      });
      expect(result).toEqual({ liked: false, likeCount: 0 });
    });

    it('should throw error if findOne fails', async () => {
      // Sobrescreve o spy para simular o post não sendo encontrado
      findOneSpy.mockRejectedValue(new NotFoundException());

      await expect(service.toggleLike(mockPostId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user_likes.findUnique).not.toHaveBeenCalled();
    });
  });
});