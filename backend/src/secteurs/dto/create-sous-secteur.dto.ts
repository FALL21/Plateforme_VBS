import { IsString, IsNotEmpty, MinLength, MaxLength, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSousSecteurDto {
  @ApiProperty({
    example: 'Alimentaire',
    description: 'Nom du sous-secteur',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du sous-secteur est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  nom: string;

  @ApiProperty({
    example: 'eaa692f7-4ad0-...',
    description: 'ID du secteur parent',
  })
  @IsUUID('4', { message: 'L\'ID du secteur doit être un UUID valide' })
  @IsNotEmpty({ message: 'Le secteur parent est requis' })
  secteurId: string;

  @ApiProperty({
    example: 'Sous-secteur regroupant les services alimentaires',
    description: 'Description du sous-secteur (optionnel)',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

