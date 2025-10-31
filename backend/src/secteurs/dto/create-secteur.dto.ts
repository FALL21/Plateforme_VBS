import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSecteurDto {
  @ApiProperty({
    example: 'Vente',
    description: 'Nom du secteur d\'activité',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du secteur est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom: string;

  @ApiProperty({
    example: 'Secteur regroupant les activités de vente et commerce',
    description: 'Description du secteur (optionnel)',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

