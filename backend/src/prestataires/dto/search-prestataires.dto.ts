import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SortOrder {
  DISTANCE = 'distance',
  NOTE = 'note',
  RECENT = 'recent',
}

export class SearchPrestatairesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sousSecteurId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  secteurId?: string;

  @ApiProperty({ required: false, description: 'Recherche texte (raison sociale, description, adresse)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  rayon?: number; // En km

  @ApiProperty({ enum: SortOrder, required: false })
  @IsOptional()
  @IsEnum(SortOrder)
  tri?: SortOrder;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

