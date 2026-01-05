import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import {
  CreateJobDto,
  UpdateCompanyDto,
  UpdateJobDto,
  AddTeamMemberDto,
  ApplyJobDto,
  UpdateTeamMemberDto,
  UpdateApplicationDto,
  FilterJobsDto,
} from './companies.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger'; 

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna todas empresas.' })
  findAll(@Query('name') name?: string) {
    return this.companiesService.findAll(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna uma empresa com base em seu ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Edita as informações de uma empresa com base em seu ID.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @Req() req) {
    return this.companiesService.update(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Deleta o registro de uma empresa com base em seu ID.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.companiesService.remove(id, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/jobs')
  @ApiOperation({ summary: 'Cria uma vaga de emprego na empresa.' })
  createJob(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateJobDto, @Req() req) {
    return this.companiesService.createJob(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/jobs/:jobId')
  @ApiOperation({ summary: 'Edita as informações sobre uma vaga.' })
  updateJob(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Body() dto: UpdateJobDto, @Req() req) {
    return this.companiesService.updateJob(id, jobId, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/jobs/:jobId')
  @ApiOperation({ summary: 'Deleta os registros sobre uma vaga.' })
  deleteJob(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Req() req) {
    return this.companiesService.deleteJob(id, jobId, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/team')
  @ApiOperation({ summary: 'Retorna todos funcionários de uma determinada empresa.' })
  getTeam(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.companiesService.getTeam(id, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/team')
  @ApiOperation({ summary: 'Adiciona um funcionário a uma determinada empresa.' })
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddTeamMemberDto, @Req() req) {
    return this.companiesService.addTeamMember(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/team/:memberId')
  @ApiOperation({ summary: 'Edita as informações de um funcionários de uma empresa.' })
  updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateTeamMemberDto,
    @Req() req,
  ) {
    return this.companiesService.updateTeamMember(id, memberId, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/team/:memberId')
  @ApiOperation({ summary: 'Remove um funcionário de uma empresa.' })
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('memberId', ParseUUIDPipe) memberId: string, @Req() req) {
    return this.companiesService.removeTeamMember(id, memberId, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id/jobs/:jobId/applications')
  @ApiOperation({ summary: 'Vê todas aplicações em uma vaga.' })
  getApplications(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Req() req) {
    return this.companiesService.getJobApplications(id, jobId, req.user['id']);
  }
  
  @UseGuards(AccessTokenGuard)
  @Patch(':id/applications/:applicationId')
  @ApiOperation({ summary: 'Edita as informações de uma determinada aplicação em uma vaga.' })
  updateApplicationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationDto,
    @Req() req,
  ) {
    return this.companiesService.updateApplicationStatus(id, applicationId, dto, req.user['id']);
  }
}

@Controller('jobs')
export class JobsController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('feed')
  getFeed(@Query() filters: FilterJobsDto) {
    return this.companiesService.findAllJobsPublic(filters);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me/applications')
  getMyApplications(@Req() req) {
    return this.companiesService.findStudentApplications(req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/apply')
  apply(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ApplyJobDto, @Req() req) {
    return this.companiesService.applyToJob(id, dto, req.user['id']);
  }
}
