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

    const { password, ...user } = await this.prismaService.users.create({ data: newUser });

    return user;
  }

  async findOne(id?: string, email?: string) {
    if (!id && !email) {
      throw new BadRequestException('Informe o id ou email do usuário.');
    }

    const user = id
      ? await this.prismaService.users.findUnique({ where: { id } })
      : await this.prismaService.users.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado!');
    }

    return user;
  }

  async findAll() {
    const users = await this.prismaService.users.findMany();
    if (users.length === 0) {
      throw new NotFoundException('Nenhum usuário encontrado!');
    }

    const safeUsers = users.map(({ password, ...user }) => user);
    return safeUsers;
  }

  async update(id: string, data: UpdateDto) {
    try {
      const { password, ...user } = await this.prismaService.users.update({
        where: { id },
        data,
      });
      return { user };
    } catch {
      throw new NotFoundException('Algo deu errado ao editar o usuário!');
    }
  }

  async remove(id: string) {
    try {
      await this.prismaService.users.delete({
        where: { id },
      });
      return { message: 'Exclusão bem-sucedida!' };
    } catch {
      throw new NotFoundException('Algo deu errado ao excluir o usuário!');
    }
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
