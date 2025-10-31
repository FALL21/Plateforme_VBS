import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';

@Injectable()
export class AuthService {
  private otpStorage: Map<string, { code: string; expiresAt: number }> = new Map();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(dto: OtpRequestDto) {
    const identifier = dto.phone || dto.email;
    
    // En mode développement, utiliser un code OTP par défaut
    const code = process.env.NODE_ENV === 'development' 
      ? '123456' 
      : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Stocker le code (expire dans 10 minutes)
    this.otpStorage.set(identifier, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // TODO: Envoyer le code via SMS ou Email
    // Pour le moment, on log le code (à remplacer en production)
    console.log(`🔑 OTP pour ${identifier}: ${code}`);

    return {
      message: 'Code OTP envoyé',
      identifier,
      // En développement, retourner le code
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const { identifier, code } = dto;
    const storedOtp = this.otpStorage.get(identifier);

    if (!storedOtp) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    if (storedOtp.expiresAt < Date.now()) {
      this.otpStorage.delete(identifier);
      throw new UnauthorizedException('Code OTP expiré');
    }

    if (storedOtp.code !== code) {
      throw new UnauthorizedException('Code OTP incorrect');
    }

    // Supprimer le code utilisé
    this.otpStorage.delete(identifier);

    // Trouver ou créer l'utilisateur
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      // Créer un nouvel utilisateur
      user = await this.prisma.user.create({
        data: {
          phone: dto.identifier.includes('+') ? identifier : undefined,
          email: dto.identifier.includes('@') ? identifier : undefined,
          actif: true,
        },
      });
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      throw new UnauthorizedException('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
    }

    // Générer les tokens JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}

