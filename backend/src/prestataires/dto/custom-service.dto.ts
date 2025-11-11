import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomServiceDto {
  @ApiProperty({ description: 'Nom du service personnalisé' })
  @IsNotEmpty()
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Identifiant du sous-secteur associé', required: false })
  @IsOptional()
  @IsUUID()
  sousSecteurId?: string;
}

