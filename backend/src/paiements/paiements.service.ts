import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MethodePaiement, StatutPaiement } from '@prisma/client';

@Injectable()
export class PaiementsService {
  constructor(private prisma: PrismaService) {}

  async initierWave(abonnementId: string, montant: number) {
    // TODO: Intégrer l'API Wave
    // Pour l'instant, on simule
    const paiement = await this.prisma.paiement.create({
      data: {
        abonnementId,
        prestataireId: await this.getPrestataireIdFromAbonnement(abonnementId),
        methode: MethodePaiement.WAVE,
        montant,
        statut: StatutPaiement.EN_ATTENTE,
        referenceExterne: `WAVE_${Date.now()}`,
      },
    });

    return {
      paiement,
      urlPaiement: `https://wave.com/pay/${paiement.referenceExterne}`, // URL simulée
    };
  }

  async initierOrangeMoney(abonnementId: string, montant: number) {
    // TODO: Intégrer l'API Orange Money
    const paiement = await this.prisma.paiement.create({
      data: {
        abonnementId,
        prestataireId: await this.getPrestataireIdFromAbonnement(abonnementId),
        methode: MethodePaiement.ORANGE_MONEY,
        montant,
        statut: StatutPaiement.EN_ATTENTE,
        referenceExterne: `OM_${Date.now()}`,
      },
    });

    return {
      paiement,
      urlPaiement: `https://orange-money.com/pay/${paiement.referenceExterne}`, // URL simulée
    };
  }

  async declarerEspeces(abonnementId: string, montant: number, justificatifUrl: string) {
    const paiement = await this.prisma.paiement.create({
      data: {
        abonnementId,
        prestataireId: await this.getPrestataireIdFromAbonnement(abonnementId),
        methode: MethodePaiement.ESPECES,
        montant,
        statut: StatutPaiement.EN_ATTENTE,
        justificatifUrl,
      },
    });

    return paiement;
  }

  async confirmerPaiement(paiementId: string, referenceExterne?: string) {
    const current = await this.prisma.paiement.findUnique({
      where: { id: paiementId },
    });

    if (!current) {
      throw new NotFoundException('Paiement non trouvé');
    }

    const paiement = await this.prisma.paiement.update({
      where: { id: paiementId },
      data: {
        statut: StatutPaiement.VALIDE,
        referenceExterne: referenceExterne ?? current.referenceExterne ?? undefined,
        dateValidation: new Date(),
      },
      include: {
        abonnement: true,
      },
    });

    // Activer l'abonnement
    if (paiement.abonnement) {
      // Importer le service d'abonnements (attention aux dépendances circulaires)
      // Pour l'instant, on active directement
      await this.prisma.abonnement.update({
        where: { id: paiement.abonnementId },
        data: { statut: 'ACTIF' },
      });

      await this.prisma.prestataire.update({
        where: { id: paiement.prestataireId },
        data: { abonnementActif: true },
      });
    }

    return paiement;
  }

  async getHistoriquePaiements(userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      return [];
    }

    return this.prisma.paiement.findMany({
      where: {
        prestataireId: prestataire.id,
      },
      include: {
        abonnement: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getPrestataireIdFromAbonnement(abonnementId: string): Promise<string> {
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id: abonnementId },
    });

    if (!abonnement) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    return abonnement.prestataireId;
  }
}

