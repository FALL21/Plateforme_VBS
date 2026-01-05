import { IsNotEmpty, IsString, IsPhoneNumber, IsEmail, ValidateIf, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OtpRequestDto {
  @ApiProperty({ 
    example: '+221771234567 ou 771234567', 
    description: 'Numéro de téléphone (avec ou sans indicatif)' 
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value) return value;
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
  @IsPhoneNumber(null, { message: 'Numéro de téléphone invalide' })
  phone?: string;

  @ApiProperty({ example: 'user@example.com', description: 'Adresse email', required: false })
  @ValidateIf((o) => !o.phone)
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email invalide' })
  email?: string;

  @ApiProperty({ 
    example: 'SN', 
    description: 'Code pays ISO (ex: SN, FR, CI). Requis si phone est fourni.', 
    required: false 
  })
  @ValidateIf((o) => !!o.phone)
  @IsOptional()
  @IsString()
  country?: string;
}

