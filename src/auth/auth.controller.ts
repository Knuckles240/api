import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthDto, SignUpDTO, VerifyDTO } from './auth.dto';
import { CookieGuard } from '../common/guards/cookie.guard';
import { BearerGuard } from '../common/guards/bearer.guard';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: SignUpDTO) {
    return await this.authService.signup(body);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    return await this.authService.login(body);
  }

  @UseGuards(BearerGuard)
  @Post('verify')
  async verify(@Body() body: VerifyDTO, @Res({ passthrough: true }) res, @Req() req) {
    const { message, accessToken, refreshToken } = await this.authService.verify(req.user['id'], body);

    res
      .cookie(jwtConstants.access_token, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 30 * 60 * 1000,
      })
      .cookie(jwtConstants.refresh_token, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });

    return {
      message,
    };
  }

  @UseGuards(CookieGuard)
  @Get('logout')
  async logout(@Res({ passthrough: true }) res, @Req() req) {
    await this.authService.logout(req.user['id']);

    res.clearCookie(process.env.REFRESH_TOKEN).clearCookie(process.env.ACCESS_TOKEN);
    return { message: 'Deslogado com sucesso!' };
  }

  @UseGuards(CookieGuard)
  @Get('refresh')
  async refreshTokens(@Res({ passthrough: true }) res, @Req() req) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(req['user'].id);
    res
      .cookie(jwtConstants.access_token, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 30 * 60 * 1000,
      })
      .cookie(jwtConstants.refresh_token, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });
  }
}
