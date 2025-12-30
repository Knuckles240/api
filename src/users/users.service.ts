import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateDto } from './users.dto';
import { PrismaService } from 'src/database/prisma.service';
import bcrypt from 'bcrypt';
import { SignUpDTO } from 'src/auth/auth.dto';

@Injectable()
export class UsersService {
  static findMyLikes: any;
  constructor(private readonly prismaService: PrismaService) {}

  async signup(data: SignUpDTO) {
    const userAlreadyExists = await this.prismaService.users.findUnique({
      where: { email: data.email },
    });
    if (userAlreadyExists) {
      throw new ConflictException('Email já utilizado.');
    }

    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(data.password, salt);
    const newUser = {
      ...data,
      password: hashPass,
      verification_code: Math.floor(100000 + Math.random() * 900000),
      verification_code_created_at: new Date(),
    };

    const user = await this.prismaService.users.create({
      data: newUser,
      omit: {
        password: true,
      },
    });

    return user;
  }

  async findForAuth(email: string) {
    return this.prismaService.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, 
        role: true,
        is_active: true,
      },
    });
  }

  async findOne(id?: string, email?: string) {
    if (!id && !email) {
      throw new BadRequestException('Informe o id ou email do usuário.');
    }

    const user = id
      ? await this.prismaService.users.findUnique({
          where: { id },
          omit: {
            password: true,
          },
        })
      : await this.prismaService.users.findUnique({
          where: { email },
          omit: {
            password: true,
          },
        });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return user;
  }

  async findAll() {
    const users = await this.prismaService.users.findMany({
      omit: {
        password: true,
      },
    });
    if (users.length === 0) {
      throw new NotFoundException('Nenhum usuário encontrado!');
    }
    return users;
  }

  async update(id: string, data: UpdateDto) {
    const user = await this.prismaService.users.update({
      where: { id },
      omit: {
        password: true,
      },
      data,
    });
    return { user };
  }

  async remove(id: string) {
    await this.prismaService.users.delete({
      where: { id },
    });
    return { message: 'Exclusão bem-sucedida!' };
  }

  async findMyLikes(userId: string) {
    const likedPostsRelations = await this.prismaService.user_likes.findMany({
      where: {
        user_id: userId,
      },
      include: {
        post: {
          include: {
            users: {
              select: {
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (likedPostsRelations.length === 0) {
      throw new NotFoundException('Nenhum post curtido encontrado.');
    }

    const posts = likedPostsRelations.map((like) => like.post);
    return { posts };
  }
}
