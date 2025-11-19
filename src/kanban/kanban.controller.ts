import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import {
  AssignTaskDto,
  CreateColumnDto,
  CreateKanbanBoardDto,
  CreateTaskDto,
  MoveTaskDto,
  UpdateColumnDto,
  UpdateKanbanBoardDto,
  UpdateTaskDto,
} from './kanban.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@UseGuards(AccessTokenGuard)
@Controller()
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  // --- Rotas de Board (Quadro) ---
  @Post('projects/:projectId/kanban')
  createBoard(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateKanbanBoardDto, @Req() req) {
    return this.kanbanService.createBoard(dto, projectId, req.user['id']);
  }

  @Get('projects/:projectId/kanban')
  getProjectBoards(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req) {
    return this.kanbanService.getProjectBoards(projectId, req.user['id']);
  }

  @Get('kanban/:id')
  getBoardDetails(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.getBoardDetails(id, req.user['id']);
  }

  @Patch('kanban/:id')
  updateBoard(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKanbanBoardDto, @Req() req) {
    return this.kanbanService.updateBoard(id, dto, req.user['id']);
  }

  @Delete('kanban/:id')
  deleteBoard(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteBoard(id, req.user['id']);
  }

  // --- Rotas de Coluna ---
  @Post('kanban/:boardId/columns')
  createColumn(@Param('boardId', ParseUUIDPipe) boardId: string, @Body() dto: CreateColumnDto, @Req() req) {
    return this.kanbanService.createColumn(dto, boardId, req.user['id']);
  }

  @Patch('columns/:id')
  updateColumn(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColumnDto, @Req() req) {
    return this.kanbanService.updateColumn(id, dto, req.user['id']);
  }

  @Delete('columns/:id')
  deleteColumn(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteColumn(id, req.user['id']);
  }

  // --- Rotas de Tarefa ---
  @Post('columns/:columnId/tasks')
  createTask(@Param('columnId', ParseUUIDPipe) columnId: string, @Body() dto: CreateTaskDto, @Req() req) {
    return this.kanbanService.createTask(dto, columnId, req.user['id']);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto, @Req() req) {
    return this.kanbanService.updateTask(id, dto, req.user['id']);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteTask(id, req.user['id']);
  }

  @Patch('tasks/:id/move')
  moveTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto, @Req() req) {
    return this.kanbanService.moveTask(id, dto, req.user['id']);
  }

  // --- Rotas de Assignee (Atribuição) ---
  @Post('tasks/:id/assign')
  assignTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignTaskDto, @Req() req) {
    return this.kanbanService.assignTask(id, dto, req.user['id']);
  }

  @Delete('tasks/:taskId/assign/:userId')
  unassignTask(@Param('taskId', ParseUUIDPipe) taskId: string, @Param('userId', ParseUUIDPipe) userId: string, @Req() req) {
    return this.kanbanService.unassignTask(taskId, userId, req.user['id']);
  }
}
