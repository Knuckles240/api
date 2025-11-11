import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { project_status_enum, visibility_enum } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  institution_id?: string;

  @IsUUID()
  @IsOptional()
  course_id?: string;

  @IsEnum(visibility_enum)
  @IsOptional()
  visibility?: visibility_enum;

  @IsEnum(project_status_enum)
  @IsOptional()
  status?: project_status_enum;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tag_ids?: string[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  role: string; // Ex: 'lider', 'membro'
}