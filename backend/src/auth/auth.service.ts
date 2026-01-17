import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { SmsService } from '../sms/sms.service';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStorage: Map<string, { code: string; expiresAt: number }> = new Map();
  private redis: Redis | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
      this.redis.on('error', (error) => {
        this.logger.warn(`⚠️ Redis indisponible: ${error?.message || error}`);
      });
    } catch (error) {
      this.logger.warn(`⚠️ Initialisation Redis échouée: ${error}`);
      this.redis = null;
    }
  }

  private async getStoredOtp(identifier: string): Promise<{ code: string; expiresAt: number } | null> {
    if (this.redis) {
      try {
        const value = await this.redis.get(`otp:${identifier}`);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Lecture Redis OTP échouée: ${error}`);
      }
    }
    return this.otpStorage.get(identifier) || null;
  }

  private async setStoredOtp(identifier: string, data: { code: string; expiresAt: number }) {
    if (this.redis) {
      try {
        const ttlSeconds = Math.max(1, Math.ceil((data.expiresAt - Date.now()) / 1000));
        await this.redis.set(`otp:${identifier}`, JSON.stringify(data), 'EX', ttlSeconds);
        return;
      } catch (error) {
        this.logger.warn(`⚠️ Écriture Redis OTP échouée: ${error}`);
      }
    }
    this.otpStorage.set(identifier, data);
  }

  private async deleteStoredOtp(identifier: string) {
    if (this.redis) {
      try {
        await this.redis.del(`otp:${identifier}`);
      } catch (error) {
        this.logger.warn(`⚠️ Suppression Redis OTP échouée: ${error}`);
      }
    }
    this.otpStorage.delete(identifier);
  }

  async requestOtp(dto: OtpRequestDto) {
    const identifier = dto.phone || dto.email;
    const now = Date.now();
    const ttlMs = 30 * 24 * 60 * 60 * 1000; // 30 jours

    // Générer un code OTP à 6 chiffres
    // En mode développement avec Twilio non configuré, utiliser un code fixe pour faciliter les tests
    const isDevMode = process.env.NODE_ENV === 'development';
    const isSmsEnabled = this.smsService.isSmsEnabled();
    const allowedSmsPhone = process.env.OTP_SMS_ALLOWED_PHONE?.trim();
    const isAllowedPhone = !!dto.phone && !!allowedSmsPhone && dto.phone === allowedSmsPhone;

    const existingOtp = await this.getStoredOtp(identifier);
    if (existingOtp && existingOtp.expiresAt <= now) {
      await this.deleteStoredOtp(identifier);
    }
    const hasValidOtp = !!existingOtp && existingOtp.expiresAt > now;

    const code =
      hasValidOtp
        ? existingOtp.code
        : (isDevMode && !isSmsEnabled) || (!!dto.phone && !isAllowedPhone)
          ? '123456'
          : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Stocker le code (valide 30 jours)
    if (!hasValidOtp) {
      await this.setStoredOtp(identifier, {
        code,
        expiresAt: now + ttlMs,
      });
    }

    // Si un code existe déjà et est encore valide, ne pas renvoyer de SMS
    if (hasValidOtp) {
      this.logger.log(`🔁 OTP déjà actif pour ${identifier}. Aucun SMS renvoyé (validité 30 jours).`);
    } else if (dto.phone && isAllowedPhone) {
      try {
        const smsSent = await this.smsService.sendOtp(dto.phone, code);
        if (!smsSent && isSmsEnabled) {
          this.logger.warn(`⚠️ Échec envoi SMS à ${dto.phone}, mais le code OTP est valide`);
        }
      } catch (error) {
        this.logger.error(`❌ Erreur lors de l'envoi du SMS à ${dto.phone}:`, error);
        // Ne pas bloquer le processus, le code est quand même valide
      }
    } else if (dto.phone && !isAllowedPhone) {
      this.logger.warn(
        `⚠️ Envoi SMS désactivé pour ${dto.phone}. Code OTP fixé à 123456 (mode provisoire).`,
      );
    } else if (dto.email) {
      // TODO: Implémenter l'envoi par email (nodemailer, SendGrid, etc.)
      this.logger.log(`📧 [TODO] Code OTP pour ${dto.email}: ${code}`);
      this.logger.warn('⚠️ L\'envoi d\'OTP par email n\'est pas encore implémenté');
    }

    return {
      message: 'Code OTP envoyé',
      identifier,
      reused: hasValidOtp,
      // En développement sans SMS configuré, ou si SMS désactivé pour le numéro, retourner le code
      code: (isDevMode && !isSmsEnabled) || (!!dto.phone && !isAllowedPhone) ? code : undefined,
    };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const { identifier, code } = dto;
    const storedOtp = await this.getStoredOtp(identifier);

    if (!storedOtp) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    if (storedOtp.expiresAt < Date.now()) {
      await this.deleteStoredOtp(identifier);
      throw new UnauthorizedException('Code OTP expiré');
    }

    if (storedOtp.code !== code) {
      throw new UnauthorizedException('Code OTP incorrect');
    }

    // Ne pas supprimer le code : il reste valide 30 jours

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
          phone: dto.identifier.includes('+') || dto.identifier.match(/^\d/) ? identifier : undefined,
          email: dto.identifier.includes('@') ? identifier : undefined,
          country: dto.country || (dto.identifier.includes('@') ? undefined : 'SN'), // Par défaut Sénégal si téléphone
          actif: true,
        },
      });
    } else if (dto.country && !user.country) {
      // Mettre à jour le pays si l'utilisateur existe mais n'a pas de pays
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { country: dto.country },
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

