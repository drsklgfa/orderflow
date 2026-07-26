import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'A senha deve possuir letra minúscula.' })
  @Matches(/[A-Z]/, { message: 'A senha deve possuir letra maiúscula.' })
  @Matches(/\d/, { message: 'A senha deve possuir número.' })
  @Matches(/[^A-Za-z0-9]/, { message: 'A senha deve possuir caractere especial.' })
  password!: string;
}
