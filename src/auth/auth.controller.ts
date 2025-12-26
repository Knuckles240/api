import { Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthDto, SignUpDTO, VerifyDTO } from './auth.dto';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { SignUpCompanyDto } from './auth.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Cria um usuário.' })
  async signup(@Body() body: SignUpDTO) {
    return await this.authService.signup(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Loga um usuário em sua conta.' })
  async login(@Body() body: AuthDto) {
    return await this.authService.login(body);
  }

  @UseGuards(AccessTokenGuard)
  @Post('verify')
  @ApiOperation({ summary: 'Verifica o número da verificação de 2 etapas.' })
  async verify(@Body() body: VerifyDTO, @Res({ passthrough: true }) res, @Req() req) {
    const { accessToken, refreshToken } = await this.authService.verify(req.user['id'], body);

    res
      .cookie(process.env.ACCESS_TOKEN, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 30 * 60 * 1000,
      })
      .cookie(process.env.REFRESH_TOKEN, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      })
      .status(200);
  }

  @Post('signup/company')
  @ApiOperation({ summary: 'Loga o usuário em uma nova empresa.' })
  async signupCompany(@Body() body: SignUpCompanyDto) {
    return await this.authService.signupCompany(body);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  @ApiOperation({ summary: 'Desloga o usuário.' })
  async logout(@Res({ passthrough: true }) res, @Req() req) {
    await this.authService.logout(req.user['id']);

    res.clearCookie(process.env.REFRESH_TOKEN).clearCookie(process.env.ACCESS_TOKEN).status(200);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  @ApiOperation({ summary: 'Gera novos tokens de acesso baseado no refresh token.' })
  async refreshTokens(@Res({ passthrough: true }) res, @Req() req) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(req['user'].id);
    res
      .cookie(process.env.ACCESS_TOKEN, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 30 * 60 * 1000,
      })
      .cookie(process.env.REFRESH_TOKEN, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      })
      .status(200);
  }
}
