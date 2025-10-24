import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Address } from 'src/modules/user/entities/address.entity';
import { UserStatus } from 'src/modules/user/enums/user-status';

export class SignUpDto {
  @ApiProperty({ description: 'The username of the user', example: 'john_doe' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'The last name of the user', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The address of the user (optional)',
    type: Address,
    required: false,
  })
  @IsOptional()
  address?: Address;

  @ApiProperty({
    description: 'The phone number of the user (optional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Password123@',
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'The profile picture URL of the user (optional)',
    example: 'http://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profilePic?: string;

  @ApiProperty({
    description: 'The status of the user',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
