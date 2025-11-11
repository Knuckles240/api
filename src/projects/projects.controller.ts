import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@UseGuards(AccessTokenGuard) // Protege todas as rotas deste controller
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(createProjectDto, req.user['id']);
  }

  @Get('me')
  findMyProjects(@Req() req) {
    return this.projectsService.findMyProjects(req.user['id']);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.projectsService.findOne(id, req.user['id']);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req) {
    return this.projectsService.update(id, updateProjectDto, req.user['id']);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.projectsService.remove(id, req.user['id']);
  }

  // --- Rotas de Membros ---

  @Post(':id/members')
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() addMemberDto: AddMemberDto, @Req() req) {
    return this.projectsService.addMember(id, addMemberDto, req.user['id']);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string, @Req() req) {
    return this.projectsService.removeMember(id, userId, req.user['id']);
  }
}
