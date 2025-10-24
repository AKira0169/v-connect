import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Address } from 'src/modules/user/entities/address.entity';

export class UpdateUserDto {
  @ApiProperty({
    description: 'The username of the user (optional)',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  userName?: string;
  @ApiProperty({
    description: 'The first name of the user (optional)',
    example: 'Jane',
    required: false,
  })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'The last name of the user (optional)',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'The profile picture URL of the user (optional)',
    example: 'http://example.com/new_profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePic?: string | undefined;

  @ApiProperty({
    description: 'The address of the user (optional)',
    type: Address,
    required: false,
  })
  @IsOptional()
  address?: Address;
}
