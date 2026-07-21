import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cliente@orderflow.demo' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 'DemoCliente123!' })
  @IsString()
  @MaxLength(128)
  password!: string;
}
