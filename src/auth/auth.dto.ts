import { IsAlpha, IsEmail, IsInt, IsNotEmpty, IsString, IsStrongPassword, Length, Max, Min } from 'class-validator';

export class SignUpDTO {
  @IsNotEmpty({ message: 'Nome não pode ser vazio.' })
  @IsAlpha(undefined, { message: 'Nome não é um texto válido.' })
  @Length(3, 100, { message: 'Nome precisa ter entre 3 e 100 caracteres.' })
  name: string;
  
  @IsNotEmpty({ message: 'Email não pode ser vazio.' })
  @IsString({ message: 'Email não é um texto válido.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;
  
  @IsNotEmpty({ message: 'Senha não pode ser vazia.' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message: 'Senha precisa ter ao menos 8 caractéres, 1 minúscula, 1 maiúscula, 1 simbolo e 1 número.',
    },
  )
  password: string;
}

export class AuthDto {
  @IsNotEmpty({ message: 'Email não pode ser vazio.' })
  @IsString({ message: 'Email não é um texto válido.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsNotEmpty({ message: 'Senha não pode ser vazia.' })
  password: string;
}

export class VerifyDTO {
  @IsInt({ message: 'Código de verificação tem que ser um número inteiro' })
  @Min(100000, { message: 'Código tem que ser maior que 100000' })
  @Max(999999, { message: 'Código tem que ser maior que 999999' })
  verification_code: number;
}
