import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'oday@gmail.com',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: '123456789Aa!',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
