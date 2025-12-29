import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { PostsModule } from './posts/posts.module';
import { KanbanModule } from './kanban/kanban.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [UsersModule, AuthModule, ProjectsModule, PostsModule, KanbanModule, CompaniesModule],
})
export class AppModule {}
