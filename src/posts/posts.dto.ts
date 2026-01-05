import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { visibility_enum } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  content_md?: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  file_type?: string;

  @IsEnum(visibility_enum)
  @IsOptional()
  visibility?: visibility_enum;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tag_ids?: string[];
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}