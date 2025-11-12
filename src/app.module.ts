import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module'; 
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [UsersModule, AuthModule, ProjectsModule, PostsModule],
})
export class AppModule {}