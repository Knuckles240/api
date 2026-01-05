import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { UpdateDto } from './users.dto';

const mockUsersService = {
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockAccessTokenGuard = {
  canActivate: jest.fn(() => true),
};

const mockUserId = 'mock-user-id';
const mockRequest = {
  user: {
    id: mockUserId,
  },
};
const mockUser = {
  id: mockUserId,
  name: 'Test User',
  email: 'test@example.com',
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne (GET /users/me)', () => {
    it('should return the authenticated user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update (PATCH /users/me)', () => {
    it('should update the authenticated user', async () => {
      const updateDto: UpdateDto = { name: 'New Name' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockUsersService.update.mockResolvedValue({
        message: 'Edição bem-sucedida!',
        user: updatedUser,
      });

      const result = await controller.update(mockRequest, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result.user).toEqual(updatedUser);
    });
  });

  describe('remove (DELETE /users/me)', () => {
    it('should remove the authenticated user', async () => {
      mockUsersService.remove.mockResolvedValue({
        message: 'Exclusão bem-sucedida!',
      });

      await controller.remove(mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockUserId);
    });
  });
});
