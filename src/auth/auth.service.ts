import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, SignUpDTO, VerifyDTO } from './auth.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(data: SignUpDTO) {
    const user = await this.usersService.signup(data);
    const { accessToken } = await this.getTokens(user.id, user.email);

    return {
      message: 'Cadastro bem-sucedido!',
      accessToken,
    };
  }

  async login(data: AuthDto) {
    const { user } = await this.usersService.findOne(undefined, data.email);
    if (!user) throw new BadRequestException('Algo deu errado ao logar!');

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const verification_code = Math.floor(100000 + Math.random() * 900000);
    await this.usersService.update(user.id, {
      verification_code,
      verification_code_created_at: new Date(),
    });

    const { accessToken } = await this.getTokens(user.id, user.email);
    return { message: 'Login bem-sucedido!', accessToken };
  }

  async verify(id: string, data: VerifyDTO) {
    const { user } = await this.usersService.findOne(id);
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
    return { message: 'Login bem-sucedido!', accessToken, refreshToken };
  }

  async hashData(data: string) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(data, salt);
  }

  async getTokens(id: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id,
          email,
        },
        {
          secret: jwtConstants.access_token_secret,
          expiresIn: '30m',
        },
      ),
      this.jwtService.signAsync(
        {
          id,
          email,
        },
        {
          secret: jwtConstants.refresh_token_secret,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(id: string) {
    const { user } = await this.usersService.findOne(id);
    if (!user) throw new BadRequestException('Nenhum usuário encontrado!');

    const tokens = await this.getTokens(user.id, user.email);
    const { accessToken, refreshToken } = await this.getTokens(user.id, user.email);
    return { message: 'Token regerado!', accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(refreshToken, { secret: jwtConstants.refresh_token_secret });

      const payload = { id: decoded.id, email: decoded.email };
      const accessToken = this.jwtService.signAsync(
        {
          id: payload.id,
          email: payload.email,
        },
        {
          secret: jwtConstants.access_token_secret,
        },
      );

      return accessToken;
    } catch (error) {
      throw new Error('Invalid refresh token or expired');
    }
  }

  async logout(id: string) {
    const { user } = await this.usersService.findOne(id);
    if (!user) throw new BadRequestException('Algo deu errado ao deslogar!');

    return true;
  }
}
