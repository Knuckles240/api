import { Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthDto, SignUpDTO, VerifyDTO } from './auth.dto';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { SignUpCompanyDto } from './auth.dto';

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

  @UseGuards(AccessTokenGuard)
  @Post('verify')
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
  async signupCompany(@Body() body: SignUpCompanyDto) {
    return await this.authService.signupCompany(body);
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(@Res({ passthrough: true }) res, @Req() req) {
    await this.authService.logout(req.user['id']);

    res.clearCookie(process.env.REFRESH_TOKEN).clearCookie(process.env.ACCESS_TOKEN).status(200);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
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
