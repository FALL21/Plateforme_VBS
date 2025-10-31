import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrestataireDto {
  @ApiProperty({ example: 'Mon Entreprise SARL' })
  @IsNotEmpty()
  @IsString()
  raisonSociale: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  serviceIds?: string[];
}

