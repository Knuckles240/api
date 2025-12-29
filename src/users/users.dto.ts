import { user_role_enum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEmail, IsInt, IsOptional, IsString, IsUrl, Length, Matches, Max, Min } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @Matches(/^[a-zA-ZÀ-ÿ\s']+$/, {
    message: 'Nome deve conter apenas letras, espaços e apóstrofos.',
  })
  @Length(3, 100, { message: 'Nome precisa ter entre 3 e 100 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Email não é um texto válido.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  @IsOptional()
  role?: user_role_enum | { set: user_role_enum };

  @IsOptional()
  @IsUrl({}, { message: 'Link do avatar é inválido.' })
  avatar_url?: string;

  @IsOptional()
  @IsString({ message: 'Biografia não é um texto válido.' })
  bio?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active deve ser booleano' })
  is_active?: boolean;

  @IsOptional()
  @IsInt({ message: 'O contador de seguidor deve ser um número' })
  followers_count?: number;

  @IsOptional()
  @IsInt({ message: 'O contador de seguindo deve ser um número' })
  following_count?: number;

  @IsOptional()
  @IsInt({ message: 'Código de verificação tem que ser um número inteiro' })
  @Min(100000, { message: 'Código tem que ser maior que 100000' })
  @Max(999999, { message: 'Código tem que ser maior que 999999' })
  verification_code?: number | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Data do código de verificação inválida' })
  verification_code_created_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Data de criação inválida' })
  created_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Data de atualização inválida' })
  updated_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Último login com data inválida' })
  last_login_at?: Date;
}
