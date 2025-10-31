import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvisDto {
  @ApiProperty({ description: 'ID de la commande' })
  @IsString()
  commandeId: string;

  @ApiProperty({ description: 'Note de 1 à 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @ApiProperty({ description: 'Commentaire (optionnel)', required: false })
  @IsOptional()
  @IsString()
  commentaire?: string;
}

