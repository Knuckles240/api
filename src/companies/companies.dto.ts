import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';
import { job_work_type_enum, job_seniority_enum } from '@prisma/client';

export class CreateCompanyDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsString() @IsNotEmpty() cnpj: string;
  @IsUrl() @IsOptional() website?: string;
  @IsString() @IsOptional() about?: string;
  @IsString() @IsOptional() headquarters?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @IsUrl() @IsOptional() logo_url?: string;
}

export class CreateJobDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsOptional() description_md?: string;
  @IsString() @IsOptional() location?: string;
  @IsEnum(job_work_type_enum) @IsOptional() work_type?: job_work_type_enum;
  @IsEnum(job_seniority_enum) @IsOptional() seniority?: job_seniority_enum;
}

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsString() @IsOptional() status?: string;
}

export class FilterJobsDto {
  @IsOptional() @IsString() search?: string; 
  @IsOptional() @IsEnum(job_work_type_enum) work_type?: job_work_type_enum;
  @IsOptional() @IsEnum(job_seniority_enum) seniority?: job_seniority_enum;
  @IsOptional() @IsString() location?: string;
}

export class AddTeamMemberDto {
  @IsString() @IsNotEmpty() user_email: string;
  @IsString() @IsNotEmpty() role: string;
}

export class UpdateTeamMemberDto {
  @IsString() @IsNotEmpty() role: string;
}

export class ApplyJobDto {
    @IsUUID() @IsOptional() referenced_project_id?: string;
    @IsUrl() @IsOptional() resume_url?: string;
}

export class UpdateApplicationDto {
    @IsString() @IsNotEmpty() status: string;
}