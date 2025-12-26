import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import {
  CreateJobDto,
  UpdateCompanyDto,
  UpdateJobDto,
  AddTeamMemberDto,
  UpdateTeamMemberDto,
  ApplyJobDto,
  UpdateApplicationDto,
  FilterJobsDto,
} from './companies.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkPermission(companyId: string, userId: string, allowedRoles: string[] = ['admin', 'recruiter']) {
    const relation = await this.prisma.company_users.findUnique({
      where: { company_id_user_id: { company_id: companyId, user_id: userId } },
    });
    if (!relation || !relation.role || !allowedRoles.includes(relation.role)) {
      throw new ForbiddenException('Sem permissão.');
    }
    return relation;
  }

  async findAll(queryName?: string) {
    return this.prisma.companies.findMany({
      where: {
        status: 'active',
        name: queryName ? { contains: queryName, mode: 'insensitive' } : undefined,
      },
      select: { id: true, name: true, logo_url: true, headquarters: true },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.companies.findUnique({
      where: { id },
      include: { jobs: { where: { status: 'active' }, orderBy: { created_at: 'desc' } } },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, userId: string) {
    await this.checkPermission(id, userId, ['admin']);
    return this.prisma.companies.update({ where: { id }, data: { ...dto, updated_at: new Date() } });
  }

  async remove(id: string, userId: string) {
    await this.checkPermission(id, userId, ['admin']);
    return this.prisma.companies.delete({ where: { id } });
  }

  // [NOVO] Busca Inteligente de Vagas (Feed)
  async findAllJobsPublic(filters: FilterJobsDto) {
    const { search, work_type, seniority, location } = filters;

    return this.prisma.jobs.findMany({
      where: {
        status: 'active', // Apenas vagas ativas na vitrine
        // Filtro por busca de texto (Título ou Descrição)
        OR: search
          ? [{ title: { contains: search, mode: 'insensitive' } }, { description_md: { contains: search, mode: 'insensitive' } }]
          : undefined,
        work_type: work_type,
        seniority: seniority,
        location: location ? { contains: location, mode: 'insensitive' } : undefined,
      },
      include: {
        companies: { select: { name: true, logo_url: true } }, // Inclui dados da empresa
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async createJob(companyId: string, dto: CreateJobDto, userId: string) {
    await this.checkPermission(companyId, userId);
    return this.prisma.jobs.create({
      data: { ...dto, company_id: companyId, status: 'active' },
    });
  }

  async updateJob(companyId: string, jobId: string, dto: UpdateJobDto, userId: string) {
    await this.checkPermission(companyId, userId);
    return this.prisma.jobs.update({
      where: { id: jobId },
      data: { ...dto, updated_at: new Date() },
    });
  }

  async deleteJob(companyId: string, jobId: string, userId: string) {
    await this.checkPermission(companyId, userId);
    return this.prisma.jobs.delete({ where: { id: jobId } });
  }

  async findStudentApplications(userId: string) {
    return this.prisma.job_applications.findMany({
      where: { applicant_user_id: userId },
      include: {
        jobs: {
          include: {
            companies: { select: { name: true, logo_url: true } },
          },
        },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  async applyToJob(jobId: string, dto: ApplyJobDto, userId: string) {
    const exists = await this.prisma.job_applications.findFirst({ where: { job_id: jobId, applicant_user_id: userId } });
    if (exists) throw new ForbiddenException('Você já se candidatou para esta vaga.');

    return this.prisma.job_applications.create({
      data: { job_id: jobId, applicant_user_id: userId, ...dto, status: 'applied' },
    });
  }

  async getTeam(companyId: string, userId: string) {
    await this.checkPermission(companyId, userId, ['admin']);
    return this.prisma.company_users.findMany({
      where: { company_id: companyId },
      include: { users: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
  }

  async addTeamMember(companyId: string, dto: AddTeamMemberDto, adminId: string) {
    await this.checkPermission(companyId, adminId, ['admin']);
    const userToAdd = await this.prisma.users.findUnique({ where: { email: dto.user_email } });
    if (!userToAdd) throw new NotFoundException('Usuário não encontrado.');

    const exists = await this.prisma.company_users.findUnique({
      where: { company_id_user_id: { company_id: companyId, user_id: userToAdd.id } },
    });
    if (exists) throw new ForbiddenException('Usuário já está na equipe.');

    return this.prisma.company_users.create({
      data: { company_id: companyId, user_id: userToAdd.id, role: dto.role },
    });
  }

  async updateTeamMember(companyId: string, memberId: string, dto: UpdateTeamMemberDto, adminId: string) {
    await this.checkPermission(companyId, adminId, ['admin']);
    if (memberId === adminId && dto.role !== 'admin') throw new ForbiddenException('Não pode rebaixar a si mesmo.');
    return this.prisma.company_users.update({
      where: { company_id_user_id: { company_id: companyId, user_id: memberId } },
      data: { role: dto.role },
    });
  }

  async removeTeamMember(companyId: string, memberId: string, adminId: string) {
    await this.checkPermission(companyId, adminId, ['admin']);
    if (memberId === adminId) throw new ForbiddenException('Não pode se remover.');
    return this.prisma.company_users.delete({
      where: { company_id_user_id: { company_id: companyId, user_id: memberId } },
    });
  }

  async getJobApplications(companyId: string, jobId: string, userId: string) {
    await this.checkPermission(companyId, userId);
    const job = await this.prisma.jobs.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Vaga não encontrada.');
    if (job.company_id !== companyId) throw new ForbiddenException('Vaga de outra empresa.');

    return this.prisma.job_applications.findMany({
      where: { job_id: jobId },
      include: {
        users: { select: { id: true, name: true, email: true, avatar_url: true } },
        projects: { select: { id: true, title: true, file_url: true } },
      },
      orderBy: { applied_at: 'desc' },
    });
  }

  async updateApplicationStatus(companyId: string, applicationId: string, dto: UpdateApplicationDto, userId: string) {
    await this.checkPermission(companyId, userId);
    const app = await this.prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: { jobs: true },
    });
    if (!app) throw new NotFoundException('Candidatura não encontrada.');
    if (app.jobs.company_id !== companyId) throw new ForbiddenException('Vaga de outra empresa.');

    return this.prisma.job_applications.update({
      where: { id: applicationId },
      data: { status: dto.status, updated_at: new Date() },
    });
  }
}
