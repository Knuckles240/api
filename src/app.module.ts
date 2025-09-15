import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { validate } from './common/env.validation';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot({
      validate: validate,
      isGlobal: true
    }),UsersModule, AuthModule],
})
export class AppModule {}