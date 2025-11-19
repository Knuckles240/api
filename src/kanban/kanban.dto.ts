import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateKanbanBoardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsJSON()
  @IsOptional()
  tags?: any; 
}

export class UpdateKanbanBoardDto extends PartialType(CreateKanbanBoardDto) {}

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  color?: string; 
}

export class UpdateColumnDto extends PartialType(CreateColumnDto) {
  @IsInt()
  @IsOptional()
  position?: number;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(400)
  description?: string; 

  @IsString()
  @IsOptional()
  @MaxLength(30)
  color?: string; 

  @IsJSON()
  @IsOptional()
  tags?: any; 
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class MoveTaskDto {
  @IsUUID()
  @IsNotEmpty()
  new_column_id: string;

  @IsInt()
  @IsNotEmpty()
  new_position: number; 
}

export class AssignTaskDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}