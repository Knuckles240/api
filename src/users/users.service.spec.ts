import { Test, TestingModule } from '@nestjs/testing';
  import { UsersService } from './users.service';
  import { PrismaService } from 'src/database/prisma.service';
  import { ConflictException, NotFoundException } from '@nestjs/common';
  import { SignUpDTO } from 'src/auth/auth.dto';

  // 1. Mockamos o PrismaService
  // Precisamos simular a "cadeia" de chamadas, ex: prismaService.users.findUnique
  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        // Mock da checagem de e-mail (não encontra ninguém)
        mockPrismaService.users.findUnique.mockResolvedValue(null);
        // Mock da criação do usuário
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
        // Mock da checagem de e-mail (encontra alguém)
        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

        // Espera que a função service.signup DÊ ERRO
        await expect(service.signup(signUpDto)).rejects.toThrow(ConflictException);
      });
    });

    describe('findOne', () => {
      it('should find a user by id', async () => {
        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

        const result = await service.findOne(mockUser.id);

        expect(prisma.users.findUnique).toHaveBeenCalledWith({
          where: { id: mockUser.id },
        });
        expect(result.user).toEqual(mockUser);
      });

      it('should throw NotFoundException if user not found', async () => {
        mockPrismaService.users.findUnique.mockResolvedValue(null);

        await expect(service.findOne('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findAll', () => {
      it('should return an array of users (without passwords)', async () => {
        const { password, ...userWithoutPass } = mockUser;
        mockPrismaService.users.findMany.mockResolvedValue([mockUser]);

        const result = await service.findAll();

        expect(result.users).toEqual([userWithoutPass]);
      });
    });

    describe('update', () => {
      it('should update a user', async () => {
        const updatedUser = { ...mockUser, name: 'Updated Name' };
        mockPrismaService.users.update.mockResolvedValue(updatedUser);

        const { password, ...userWithoutPass } = updatedUser;
        const result = await service.update(mockUser.id, {
          name: 'Updated Name',
        });

        expect(result.user).toEqual(userWithoutPass);
      });
    });

    describe('remove', () => {
      it('should remove a user', async () => {
        mockPrismaService.users.delete.mockResolvedValue(mockUser);

        const result = await service.remove(mockUser.id);
        expect(result.message).toEqual('Exclusão bem-sucedida!');
      });
    });
  });