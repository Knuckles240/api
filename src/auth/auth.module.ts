import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { CookieStrategy } from './strategies/cookie.strategy';
import { BearerStrategy } from './strategies/bearer.strategy';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, CookieStrategy, BearerStrategy],
})
export class AuthModule {}
