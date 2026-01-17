import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeclarerEspecesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  abonnementId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  montant: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justificatifUrl?: string;
}

