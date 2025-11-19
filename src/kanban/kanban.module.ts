import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [KanbanController],
  providers: [KanbanService, PrismaService],
  exports: [KanbanService],
})
export class KanbanModule {}
