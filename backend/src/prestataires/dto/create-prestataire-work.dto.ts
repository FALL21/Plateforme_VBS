import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrestataireWorkDto {
  @ApiProperty({
    description: "URL de l'image du travail récent (après upload via /files/upload)",
    example: 'https://cdn.vbs.sn/files/mon-travail-1.jpg',
  })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiProperty({
    description: 'Titre court du travail réalisé',
    example: 'Nettoyage bureaux – Plateau',
    required: false,
  })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiProperty({
    description: 'Description courte (facultative)',
    example: 'Nettoyage complet des locaux (200 m²) pour une PME au Plateau.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}



