import { IsString, IsNotEmpty, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSecteurDto {
  @ApiProperty({
    example: 'Vente et Commerce',
    description: 'Nouveau nom du secteur',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom du secteur ne peut pas être vide' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom?: string;

  @ApiProperty({
    example: 'Secteur regroupant les activités de vente et commerce',
    description: 'Description du secteur',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Statut actif/inactif du secteur',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

