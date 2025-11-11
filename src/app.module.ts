import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module'; 

@Module({
  imports: [UsersModule, AuthModule, ProjectsModule],
})
export class AppModule {}