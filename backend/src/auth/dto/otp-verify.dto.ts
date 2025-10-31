import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OtpVerifyDto {
  @ApiProperty({ 
    example: '+221771234567 ou 771234567', 
    description: 'Numéro de téléphone (avec ou sans indicatif +221) ou email' 
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => {
    if (!value) return value;
    // Si c'est un email, ne pas transformer
    if (value.includes('@')) return value;
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    let cleaned = value.toString().replace(/[\s\-\(\)]/g, '');
    // Si le numéro commence par 7 (numéros sénégalais) et a 9 chiffres, ajouter +221
    if (/^7\d{8}$/.test(cleaned)) {
      cleaned = '+221' + cleaned;
    }
    // Si le numéro commence par 221 sans +, ajouter le +
    else if (/^221\d{9}$/.test(cleaned)) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  })
  identifier: string;

  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  code: string;
}

