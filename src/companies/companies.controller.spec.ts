import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController, JobsController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { CreateJobDto, UpdateCompanyDto, UpdateJobDto, AddTeamMemberDto, UpdateTeamMemberDto, ApplyJobDto, UpdateApplicationDto, FilterJobsDto } from './companies.dto';
import { job_work_type_enum, job_seniority_enum } from '@prisma/client';

const mockCompaniesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findAllJobsPublic: jest.fn(), 
  findStudentApplications: jest.fn(), 
  createJob: jest.fn(),
  updateJob: jest.fn(),
  deleteJob: jest.fn(),
  getTeam: jest.fn(),
  addTeamMember: jest.fn(),
  updateTeamMember: jest.fn(),
  removeTeamMember: jest.fn(),
  getJobApplications: jest.fn(),
  updateApplicationStatus: jest.fn(),
  applyToJob: jest.fn(),
};

const mockAccessTokenGuard = {
  canActivate: jest.fn(() => true),
};

const mockUserId = 'user-uuid-123';
const mockCompanyId = 'company-uuid-456';
const mockJobId = 'job-uuid-789';
const mockMemberId = 'member-uuid-999';
const mockAppId = 'application-uuid-000';
const mockRequest = { user: { id: mockUserId } };

describe('Companies & Jobs Controllers', () => {
  let companiesController: CompaniesController;
  let jobsController: JobsController;
  let service: CompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController, JobsController],
      providers: [
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue(mockAccessTokenGuard)
      .compile();

    companiesController = module.get<CompaniesController>(CompaniesController);
    jobsController = module.get<JobsController>(JobsController);
    service = module.get<CompaniesService>(CompaniesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(companiesController).toBeDefined();
    expect(jobsController).toBeDefined();
  });

  describe('findAll (Empresas)', () => {
    it('should return list of companies with filter', async () => {
      mockCompaniesService.findAll.mockResolvedValue([]);
      await companiesController.findAll('SpaceX');
      expect(service.findAll).toHaveBeenCalledWith('SpaceX');
    });
  });

  describe('update (Empresa)', () => {
    it('should update company details', async () => {
      const dto: UpdateCompanyDto = { name: 'New Name' };
      await companiesController.update(mockCompanyId, dto, mockRequest);
      expect(service.update).toHaveBeenCalledWith(mockCompanyId, dto, mockUserId);
    });
  });

  describe('remove (Empresa)', () => {
    it('should remove company', async () => {
      await companiesController.remove(mockCompanyId, mockRequest);
      expect(service.remove).toHaveBeenCalledWith(mockCompanyId, mockUserId);
    });
  });

  describe('createJob', () => {
    it('should create a job', async () => {
      const dto: CreateJobDto = { title: 'Dev', work_type: job_work_type_enum.remote };
      await companiesController.createJob(mockCompanyId, dto, mockRequest);
      expect(service.createJob).toHaveBeenCalledWith(mockCompanyId, dto, mockUserId);
    });
  });

  describe('updateJob', () => {
    it('should update a job', async () => {
      const dto: UpdateJobDto = { status: 'closed' };
      await companiesController.updateJob(mockCompanyId, mockJobId, dto, mockRequest);
      expect(service.updateJob).toHaveBeenCalledWith(mockCompanyId, mockJobId, dto, mockUserId);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      await companiesController.deleteJob(mockCompanyId, mockJobId, mockRequest);
      expect(service.deleteJob).toHaveBeenCalledWith(mockCompanyId, mockJobId, mockUserId);
    });
  });

  describe('Team Management', () => {
    it('should add a team member', async () => {
      const dto: AddTeamMemberDto = { user_email: 'rh@test.com', role: 'recruiter' };
      await companiesController.addMember(mockCompanyId, dto, mockRequest);
      expect(service.addTeamMember).toHaveBeenCalledWith(mockCompanyId, dto, mockUserId);
    });

    it('should update team member role', async () => {
      const dto: UpdateTeamMemberDto = { role: 'admin' };
      await companiesController.updateMember(mockCompanyId, mockMemberId, dto, mockRequest);
      expect(service.updateTeamMember).toHaveBeenCalledWith(mockCompanyId, mockMemberId, dto, mockUserId);
    });

    it('should remove a team member', async () => {
      await companiesController.removeMember(mockCompanyId, mockMemberId, mockRequest);
      expect(service.removeTeamMember).toHaveBeenCalledWith(mockCompanyId, mockMemberId, mockUserId);
    });
  });

  describe('ATS Features', () => {
    it('should get job applications', async () => {
      await companiesController.getApplications(mockCompanyId, mockJobId, mockRequest);
      expect(service.getJobApplications).toHaveBeenCalledWith(mockCompanyId, mockJobId, mockUserId);
    });

    it('should update application status', async () => {
      const dto: UpdateApplicationDto = { status: 'hired' };
      await companiesController.updateApplicationStatus(mockCompanyId, mockAppId, dto, mockRequest);
      expect(service.updateApplicationStatus).toHaveBeenCalledWith(mockCompanyId, mockAppId, dto, mockUserId);
    });
  });

  describe('JobsController (Public/Student)', () => {
    it('should return feed with filters', async () => {
      const filters: FilterJobsDto = { search: 'Nest', seniority: job_seniority_enum.jr };
      await jobsController.getFeed(filters);
      expect(service.findAllJobsPublic).toHaveBeenCalledWith(filters);
    });

    it('should return student applications history', async () => {
      await jobsController.getMyApplications(mockRequest);
      expect(service.findStudentApplications).toHaveBeenCalledWith(mockUserId);
    });

    it('should apply to a job', async () => {
      const dto: ApplyJobDto = { resume_url: 'http://cv.com' };
      await jobsController.apply(mockJobId, dto, mockRequest);
      expect(service.applyToJob).toHaveBeenCalledWith(mockJobId, dto, mockUserId);
    });
  });
});