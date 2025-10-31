import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';

@Injectable()
export class AbonnementsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.planAbonnement.findMany({
      where: { actif: true },
      orderBy: { prix: 'asc' },
    });
  }

  async create(userId: string, dto: CreateAbonnementDto) {
    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existingActive = await this.prisma.abonnement.findFirst({
      where: {
        prestataire: { userId },
        statut: 'ACTIF',
      },
    });

    if (existingActive) {
      throw new BadRequestException('Vous avez déjà un abonnement actif');
    }

    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new BadRequestException('Vous devez d\'abord créer un profil prestataire');
    }

    // Calculer les dates
    const dateDebut = new Date();
    const dateFin = new Date();
    if (dto.type === 'MENSUEL') {
      dateFin.setMonth(dateFin.getMonth() + 1);
    } else {
      dateFin.setFullYear(dateFin.getFullYear() + 1);
    }

    // Récupérer le plan si fourni
    let plan = null;
    let tarif = dto.tarif;
    if (dto.planId) {
      plan = await this.prisma.planAbonnement.findUnique({
        where: { id: dto.planId },
      });
      if (plan) {
        tarif = plan.prix;
      }
    }

    const abonnement = await this.prisma.abonnement.create({
      data: {
        prestataireId: prestataire.id,
        planId: plan?.id,
        type: dto.type,
        dateDebut,
        dateFin,
        tarif,
        statut: 'EN_ATTENTE', // Sera activé après paiement
      },
      include: {
        plan: true,
      },
    });

    return abonnement;
  }

  async findMyAbonnement(userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      return null;
    }

    return this.prisma.abonnement.findFirst({
      where: {
        prestataireId: prestataire.id,
        statut: 'ACTIF',
      },
      include: {
        plan: true,
        paiements: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async activateAbonnement(abonnementId: string) {
    const abonnement = await this.prisma.abonnement.update({
      where: { id: abonnementId },
      data: {
        statut: 'ACTIF',
      },
    });

    // Activer la visibilité du prestataire
    await this.prisma.prestataire.update({
      where: { id: abonnement.prestataireId },
      data: {
        abonnementActif: true,
      },
    });

    return abonnement;
  }

  async checkExpirations() {
    const now = new Date();
    const expired = await this.prisma.abonnement.findMany({
      where: {
        statut: 'ACTIF',
        dateFin: {
          lt: now,
        },
      },
      include: {
        prestataire: true,
      },
    });

    for (const abonnement of expired) {
      await this.prisma.abonnement.update({
        where: { id: abonnement.id },
        data: { statut: 'EXPIRE' },
      });

      await this.prisma.prestataire.update({
        where: { id: abonnement.prestataireId },
        data: { abonnementActif: false },
      });
    }

    return expired.length;
  }
}

