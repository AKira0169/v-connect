import { ApiProperty } from '@nestjs/swagger';
import { Column } from 'typeorm';

export class Address {
  @ApiProperty({ description: 'The street name', example: '123 Main St' })
  @Column()
  street: string;

  @ApiProperty({
    description: 'The building name or number',
    example: 'Building A',
  })
  @Column()
  building: string;

  @ApiProperty({ description: 'The city', example: 'New York' })
  @Column()
  city: string;

  @ApiProperty({
    description: 'The floor number (optional)',
    example: '5',
    required: false,
  })
  @Column({ nullable: true })
  floor: string;

  @ApiProperty({
    description: 'The apartment number (optional)',
    example: '101',
    required: false,
  })
  @Column({ nullable: true })
  apartment: string;

  @ApiProperty({ description: 'The country', example: 'USA' })
  @Column()
  country: string;
}
