import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  justificatifUrl: string;
}

