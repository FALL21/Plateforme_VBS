import { IsNotEmpty, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TypeAbonnement } from '@prisma/client';

export class CreateAbonnementDto {
  @ApiProperty({ enum: TypeAbonnement })
  @IsNotEmpty()
  @IsEnum(TypeAbonnement)
  type: TypeAbonnement;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tarif?: number;
}

