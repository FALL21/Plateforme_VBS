import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { TypeAbonnement } from '@prisma/client';

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
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new BadRequestException('Vous devez d\'abord créer un profil prestataire');
    }

    await this.ensureNoActiveOrPendingAbonnement(prestataire.id, dto.type as TypeAbonnement);

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
        statut: {
          in: ['EN_ATTENTE', 'ACTIF'],
        },
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
      orderBy: {
        createdAt: 'desc',
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

    // Activer la visibilité du prestataire et sa disponibilité
    await this.prisma.prestataire.update({
      where: { id: abonnement.prestataireId },
      data: {
        abonnementActif: true,
        disponibilite: true,
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

  private async ensureNoActiveOrPendingAbonnement(prestataireId: string, type: TypeAbonnement) {
    const now = new Date();

    const period =
      type === TypeAbonnement.MENSUEL
        ? {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
          }
        : {
            start: new Date(now.getFullYear(), 0, 1),
            end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
          };

    const existing = await this.prisma.abonnement.findFirst({
      where: {
        prestataireId,
        type,
        statut: { in: ['EN_ATTENTE', 'ACTIF'] },
        dateDebut: { lte: period.end },
        dateFin: { gte: period.start },
      },
    });

    if (existing) {
      throw new BadRequestException(
        type === TypeAbonnement.MENSUEL
          ? 'Vous avez déjà un abonnement mensuel actif ou en attente pour le mois en cours.'
          : 'Vous avez déjà un abonnement annuel actif ou en attente pour l\'année en cours.',
      );
    }
  }
}

