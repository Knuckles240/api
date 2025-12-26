import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AddMemberDto, CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger'; 

@ApiTags('Projects')
@UseGuards(AccessTokenGuard) 
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo projeto.' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(createProjectDto, req.user['id']);
  }
  
  @Get('me')
  @ApiOperation({ summary: 'Retorna todos projetos que meu usuário está associado.' })
  findMyProjects(@Req() req) {
    return this.projectsService.findMyProjects(req.user['id']);
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Retorna informações de um projeto com base em seu ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.projectsService.findOne(id, req.user['id']);
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'Edita as informações de um projeto.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req) {
    return this.projectsService.update(id, updateProjectDto, req.user['id']);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Deleta um projeto.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.projectsService.remove(id, req.user['id']);
  }
  
  @Post(':id/members')
  @ApiOperation({ summary: 'Adiciona um membro a um projeto.' })
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() addMemberDto: AddMemberDto, @Req() req) {
    return this.projectsService.addMember(id, addMemberDto, req.user['id']);
  }
  
  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove um membro de um projeto.' })
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string, @Req() req) {
    return this.projectsService.removeMember(id, userId, req.user['id']);
  }
}
