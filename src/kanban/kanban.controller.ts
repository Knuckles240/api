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
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Kanban')
@UseGuards(AccessTokenGuard)
@Controller()
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Post('projects/:projectId/kanban')
  @ApiOperation({ summary: 'Cria um novo Kanban.' })
  createBoard(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateKanbanBoardDto, @Req() req) {
    return this.kanbanService.createBoard(dto, projectId, req.user['id']);
  }

  @Get('projects/:projectId/kanban')
  @ApiOperation({ summary: 'Retorna o Kanban de um projeto.' })
  getProjectBoards(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req) {
    return this.kanbanService.getProjectBoards(projectId, req.user['id']);
  }

  @Get('kanban/:id')
  @ApiOperation({ summary: 'Retorna os detalhes de um Kanban.' })
  getBoardDetails(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.getBoardDetails(id, req.user['id']);
  }

  @Patch('kanban/:id')
  @ApiOperation({ summary: 'Edita informações de um Kanban.' })
  updateBoard(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKanbanBoardDto, @Req() req) {
    return this.kanbanService.updateBoard(id, dto, req.user['id']);
  }

  @Delete('kanban/:id')
  @ApiOperation({ summary: 'Deleta o registro de um Kanban.' })
  deleteBoard(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteBoard(id, req.user['id']);
  }

  @Post('kanban/:boardId/columns')
  @ApiOperation({ summary: 'Cria uma nova coluna no Kanban.' })
  createColumn(@Param('boardId', ParseUUIDPipe) boardId: string, @Body() dto: CreateColumnDto, @Req() req) {
    return this.kanbanService.createColumn(dto, boardId, req.user['id']);
  }

  @Patch('columns/:id')
  @ApiOperation({ summary: 'Edita as informações de uma coluna no Kanban.' })
  updateColumn(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColumnDto, @Req() req) {
    return this.kanbanService.updateColumn(id, dto, req.user['id']);
  }

  @Delete('columns/:id')
  @ApiOperation({ summary: 'Deleta o registro de uma coluna no Kanban.' })
  deleteColumn(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteColumn(id, req.user['id']);
  }

  @Post('columns/:columnId/tasks')
  @ApiOperation({ summary: 'Cria uma nova tarefa no Kanban.' })
  createTask(@Param('columnId', ParseUUIDPipe) columnId: string, @Body() dto: CreateTaskDto, @Req() req) {
    return this.kanbanService.createTask(dto, columnId, req.user['id']);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Edita as informações de uma tarefa no Kanban.' })
  updateTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto, @Req() req) {
    return this.kanbanService.updateTask(id, dto, req.user['id']);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Deleta o registro de uma tarefa no Kanban.' })
  deleteTask(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.kanbanService.deleteTask(id, req.user['id']);
  }
  
  @Patch('tasks/:id/move')
  @ApiOperation({ summary: 'Muda a coluna e posição de uma tarefa no Kanban.' })
  moveTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto, @Req() req) {
    return this.kanbanService.moveTask(id, dto, req.user['id']);
  }
  
  @Post('tasks/:id/assign')
  @ApiOperation({ summary: 'Associa um membro do projeto pra determinada tarefa no Kanban.' })
  assignTask(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignTaskDto, @Req() req) {
    return this.kanbanService.assignTask(id, dto, req.user['id']);
  }
  
  @Delete('tasks/:taskId/assign/:userId')
  @ApiOperation({ summary: 'Desassocia um membro do projeto pra determinada tarefa no Kanban.' })
  unassignTask(@Param('taskId', ParseUUIDPipe) taskId: string, @Param('userId', ParseUUIDPipe) userId: string, @Req() req) {
    return this.kanbanService.unassignTask(taskId, userId, req.user['id']);
  }
}
