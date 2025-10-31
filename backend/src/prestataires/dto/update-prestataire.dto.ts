import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePrestataireDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  disponibilite?: boolean;
}


