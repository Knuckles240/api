import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/database/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SignUpDTO } from 'src/auth/auth.dto';

// 1. Mockamos o PrismaService
const mockPrismaService = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  // Mock da tabela de likes (para o teste findMyLikes)
  user_likes: {
    findMany: jest.fn(),
  },
};

const mockUser = {
  id: 'mock-user-id',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  verification_code: 123456,
  verification_code_created_at: new Date(),
  // ...outros campos do usuário
};

// Mock de um post (para o retorno de findMyLikes)
const mockPost = {
  id: 'mock-post-id',
  title: 'Meu Post Curtido',
  content_md: '...',
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        // 2. Fornecemos o mock do PrismaService
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signUpDto: SignUpDTO = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      const { password, ...userWithoutPass } = mockUser;
      mockPrismaService.users.create.mockResolvedValue(mockUser);

      const result = await service.signup(signUpDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
      expect(prisma.users.create).toHaveBeenCalled();
      expect(result).toEqual(userWithoutPass);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      await expect(service.signup(signUpDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      // O serviço retorna { message, user }
      const result = await service.findOne(mockUser.id);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      // A CORREÇÃO ESTÁ AQUI:
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no id or email is provided', async () => {
      await expect(service.findOne(undefined, undefined)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users (without passwords)', async () => {
      const { password, ...userWithoutPass } = mockUser;
      mockPrismaService.users.findMany.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([userWithoutPass]);
    });

    it('should throw NotFoundException if no users are found', async () => {
      mockPrismaService.users.findMany.mockResolvedValue([]);
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockPrismaService.users.update.mockResolvedValue(updatedUser);

      const { password, ...userWithoutPass } = updatedUser;
      // O serviço retorna { message, user }
      const result = await service.update(mockUser.id, {
        name: 'Updated Name',
      });

      // A CORREÇÃO ESTÁ AQUI:
      expect(result.user).toEqual(userWithoutPass);
    });

    it('should throw NotFoundException on update failure', async () => {
      mockPrismaService.users.update.mockRejectedValue(new Error());
      await expect(service.update(mockUser.id, { name: 'Fail' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockPrismaService.users.delete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser.id);
      expect(result.message).toEqual('Exclusão bem-sucedida!');
    });

    it('should throw NotFoundException on remove failure', async () => {
      mockPrismaService.users.delete.mockRejectedValue(new Error());
      await expect(service.remove(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyLikes', () => {
    it('should return liked posts for a user', async () => {
      const mockLikeRelation = [
        {
          user_id: mockUser.id,
          post_id: mockPost.id,
          created_at: new Date(),
          post: mockPost,
        },
      ];
      mockPrismaService.user_likes.findMany.mockResolvedValue(mockLikeRelation);

      const result = await service.findMyLikes(mockUser.id);

      expect(prisma.user_likes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: mockUser.id },
        }),
      );
      expect(result.posts).toEqual([mockPost]);
    });

    it('should throw NotFoundException if no liked posts are found', async () => {
      mockPrismaService.user_likes.findMany.mockResolvedValue([]);
      await expect(service.findMyLikes(mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });
});
