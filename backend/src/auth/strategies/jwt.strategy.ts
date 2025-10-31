import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        actif: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      throw new UnauthorizedException('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
    }

    return user;
  }
}

