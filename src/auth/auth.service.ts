import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/database/prisma.service'; 
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, SignUpDTO, VerifyDTO, SignUpCompanyDto } from './auth.dto';
import { jwtConstants } from './constants';
import { user_role_enum } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prismaService: PrismaService, // <--- AQUI ESTAVA O ERRO
  ) {}

  async signup(data: SignUpDTO) {
    const user = await this.usersService.signup(data);
    const { accessToken } = await this.getTokens(user.id, user.email);
    return { accessToken };
  }

  async login(data: AuthDto) {
    const user = await this.usersService.findOne(undefined, data.email);
    if (!user) throw new BadRequestException('Algo deu errado ao logar!');

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Gera código (opcional no fluxo normal, mas mantido conforme seu código original)
    const verification_code = Math.floor(100000 + Math.random() * 900000);
    await this.usersService.update(user.id, {
      verification_code,
      verification_code_created_at: new Date(),
    });

    const { accessToken } = await this.getTokens(user.id, user.email);
    return { accessToken };
  }

  async verify(id: string, data: VerifyDTO) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new BadRequestException('Algo deu errado ao verificar!');

    if (!data.verification_code || user.verification_code !== data.verification_code) {
      throw new BadRequestException('Código de verificação inválido.');
    }

    if (!user.verification_code_created_at) {
      throw new BadRequestException('Nenhum código de verificação foi gerado.');
    }

    const verification_code_created_at = new Date(user.verification_code_created_at);
    const hour = 60 * 60 * 1000;
    const isExpired = new Date().getTime() - verification_code_created_at.getTime() > hour;
    if (isExpired) {
      throw new BadRequestException('O código de verificação expirou.');
    }

    await this.usersService.update(user.id, {
      verification_code: null,
      verification_code_created_at: null,
    });

    const { accessToken, refreshToken } = await this.getTokens(user.id, user.email);
    return { accessToken, refreshToken };
  }

  async hashData(data: string) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(data, salt);
  }

  async getTokens(id: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id, email },
        { secret: jwtConstants.access_token_secret, expiresIn: '30m' },
      ),
      this.jwtService.signAsync(
        { id, email },
        { secret: jwtConstants.refresh_token_secret },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new BadRequestException('Nenhum usuário encontrado!');

    const { accessToken, refreshToken } = await this.getTokens(user.id, user.email);
    return { accessToken, refreshToken };
  }
  
  async logout(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new BadRequestException('Algo deu errado ao deslogar!');
    return true;
  }  

  // --- CADASTRO CORPORATIVO ---
  async signupCompany(data: SignUpCompanyDto) {
    const userExists = await this.usersService.findOne(undefined, data.user_email).catch(() => null);
    if (userExists) throw new BadRequestException('Email já cadastrado.');

    const companyExists = await this.prismaService.companies.findUnique({ where: { cnpj: data.cnpj } });
    if (companyExists) throw new ConflictException('CNPJ já cadastrado.');

    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(data.user_password, salt);

    return this.prismaService.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          name: data.user_name,
          email: data.user_email,
          password: hashPass,
          role: user_role_enum.company_admin,
          is_active: true,
          verification_code: Math.floor(100000 + Math.random() * 900000),
          verification_code_created_at: new Date(),
        },
      });

      const newCompany = await tx.companies.create({
        data: {
          name: data.company_name,
          cnpj: data.cnpj,
          website: data.website,
          headquarters: data.headquarters,
          status: 'pending',
        },
      });

      await tx.company_users.create({
        data: {
          user_id: newUser.id,
          company_id: newCompany.id,
          role: 'admin',
        },
      });

      const tokens = await this.getTokens(newUser.id, newUser.email);
      return { user: newUser, company: newCompany, ...tokens };
    });
  }
}