import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreateJobDto, UpdateCompanyDto, UpdateJobDto, AddTeamMemberDto, ApplyJobDto, UpdateTeamMemberDto, UpdateApplicationDto, FilterJobsDto } from './companies.dto';

// --- CONTROLLER DE EMPRESAS (Foco no Gestor) ---
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@Query('name') name?: string) { 
    return this.companiesService.findAll(name); 
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.companiesService.findOne(id); }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @Req() req) {
    return this.companiesService.update(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.companiesService.remove(id, req.user['id']);
  }

  // --- GESTÃO DE VAGAS (Pela Empresa) ---
  @UseGuards(AccessTokenGuard)
  @Post(':id/jobs')
  createJob(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateJobDto, @Req() req) {
    return this.companiesService.createJob(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/jobs/:jobId')
  updateJob(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Body() dto: UpdateJobDto, @Req() req) {
    return this.companiesService.updateJob(id, jobId, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/jobs/:jobId')
  deleteJob(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Req() req) {
    return this.companiesService.deleteJob(id, jobId, req.user['id']);
  }

  // --- GESTÃO DE EQUIPE ---
  @UseGuards(AccessTokenGuard)
  @Get(':id/team')
  getTeam(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.companiesService.getTeam(id, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Post(':id/team')
  addMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddTeamMemberDto, @Req() req) {
    return this.companiesService.addTeamMember(id, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/team/:memberId')
  updateMember(@Param('id', ParseUUIDPipe) id: string, @Param('memberId', ParseUUIDPipe) memberId: string, @Body() dto: UpdateTeamMemberDto, @Req() req) {
    return this.companiesService.updateTeamMember(id, memberId, dto, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id/team/:memberId')
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('memberId', ParseUUIDPipe) memberId: string, @Req() req) {
    return this.companiesService.removeTeamMember(id, memberId, req.user['id']);
  }

  // --- ATS (Recrutador) ---
  @UseGuards(AccessTokenGuard)
  @Get(':id/jobs/:jobId/applications')
  getApplications(@Param('id', ParseUUIDPipe) id: string, @Param('jobId', ParseUUIDPipe) jobId: string, @Req() req) {
      return this.companiesService.getJobApplications(id, jobId, req.user['id']);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/applications/:applicationId')
  updateApplicationStatus(@Param('id', ParseUUIDPipe) id: string, @Param('applicationId', ParseUUIDPipe) applicationId: string, @Body() dto: UpdateApplicationDto, @Req() req) {
      return this.companiesService.updateApplicationStatus(id, applicationId, dto, req.user['id']);
  }
}

// --- CONTROLLER DE VAGAS (Foco no Candidato/Vitrine) ---
@Controller('jobs')
export class JobsController {
    constructor(private readonly companiesService: CompaniesService) {}

    // [NOVO] Feed de Vagas com Filtros
    // Ex: /jobs/feed?work_type=remote&seniority=jr&search=React
    @Get('feed')
    getFeed(@Query() filters: FilterJobsDto) {
        return this.companiesService.findAllJobsPublic(filters);
    }

    // [NOVO] Minhas Candidaturas
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