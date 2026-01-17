import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MethodePaiement, StatutPaiement, TypeAbonnement } from '@prisma/client';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class PaiementsService {
  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  async initierWave(abonnementId: string, montant: number) {
    // Vérifier que l'abonnement existe et récupérer le prestataireId
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id: abonnementId },
      include: { prestataire: true },
    });

    if (!abonnement) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (!abonnement.prestataire) {
      throw new NotFoundException('Prestataire associé à l\'abonnement non trouvé');
    }

    await this.ensureAbonnementDisponible(abonnementId, MethodePaiement.WAVE);

    // Créer le paiement associé à l'abonnement
    const paiement = await this.prisma.paiement.create({
      data: {
        abonnementId,
        prestataireId: abonnement.prestataireId,
        methode: MethodePaiement.WAVE,
        montant,
        statut: StatutPaiement.EN_ATTENTE,
        referenceExterne: `WAVE_${Date.now()}`,
      },
      include: {
        abonnement: {
          include: {
            plan: true,
          },
        },
      },
    });

    return {
      paiement,
      urlPaiement: `https://wave.com/pay/${paiement.referenceExterne}`, // URL simulée
    };
  }

  async declarerEspeces(abonnementId: string, montant: number, justificatifUrl: string) {
    // Vérifier que l'abonnement existe et récupérer le prestataireId
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id: abonnementId },
      include: { prestataire: true },
    });

    if (!abonnement) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (!abonnement.prestataire) {
      throw new NotFoundException('Prestataire associé à l\'abonnement non trouvé');
    }

    await this.ensureAbonnementDisponible(abonnementId, MethodePaiement.ESPECES);

    // Créer le paiement associé à l'abonnement
    const paiement = await this.prisma.paiement.create({
      data: {
        abonnementId,
        prestataireId: abonnement.prestataireId,
        methode: MethodePaiement.ESPECES,
        montant,
        statut: StatutPaiement.EN_ATTENTE,
        justificatifUrl,
      },
      include: {
        abonnement: {
          include: {
            plan: true,
          },
        },
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
      const abonnementActif = await this.prisma.abonnement.update({
        where: { id: paiement.abonnementId },
        data: { statut: 'ACTIF' },
        include: {
          prestataire: {
            include: {
              user: {
                select: {
                  phone: true,
                },
              },
            },
          },
          plan: true,
        },
      });

      await this.prisma.prestataire.update({
        where: { id: paiement.prestataireId },
        data: { abonnementActif: true, disponibilite: true },
      });

      // Envoyer une notification SMS au prestataire
      if (abonnementActif.prestataire?.user?.phone) {
        const planNom = abonnementActif.plan?.nom || abonnementActif.type;
        const dateFin = new Date(abonnementActif.dateFin).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        
        const message = `🎉 Félicitations ! Votre abonnement ${planNom} VBS est maintenant actif. Votre profil est visible et vous pouvez recevoir des commandes. Expire le ${dateFin}.`;
        
        try {
          await this.smsService.sendNotification(
            abonnementActif.prestataire.user.phone,
            message,
          );
        } catch (error) {
          // Ne pas bloquer le processus si l'envoi SMS échoue
          console.error('Erreur lors de l\'envoi de la notification SMS:', error);
        }
      }
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

  private async ensureAbonnementDisponible(abonnementId: string, methode: MethodePaiement) {
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id: abonnementId },
      include: { plan: true },
    });

    if (!abonnement) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    if (abonnement.statut === 'ACTIF') {
      throw new BadRequestException('Un abonnement actif existe déjà pour cette période.');
    }

    const now = new Date();

    const existingPending = await this.prisma.paiement.findFirst({
      where: {
        abonnementId,
        statut: StatutPaiement.EN_ATTENTE,
        methode,
      },
    });

    if (existingPending) {
      throw new BadRequestException('Un paiement est déjà en attente de validation pour cet abonnement.');
    }

    // Suppression de la validation qui empêchait de créer un paiement s'il existe déjà un abonnement actif/en attente
    // const prestataireId = abonnement.prestataireId;
    // const planType = (abonnement.plan?.type || abonnement.type) as TypeAbonnement;

    // if (planType === TypeAbonnement.MENSUEL) {
    //   const startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    //   const endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    //   const existingActive = await this.prisma.abonnement.findFirst({
    //     where: {
    //       prestataireId,
    //       type: planType,
    //       statut: { in: ['EN_ATTENTE', 'ACTIF'] },
    //       dateDebut: { lte: endPeriod },
    //       dateFin: { gte: startPeriod },
    //     },
    //   });

    //   if (existingActive) {
    //     throw new BadRequestException('Vous avez déjà un abonnement mensuel actif ou en attente pour la période en cours.');
    //   }
    // } else if (planType === TypeAbonnement.ANNUEL) {
    //   const startYear = new Date(now.getFullYear(), 0, 1);
    //   const endYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    //   const existingActive = await this.prisma.abonnement.findFirst({
    //     where: {
    //       prestataireId,
    //       type: planType,
    //       statut: { in: ['EN_ATTENTE', 'ACTIF'] },
    //       dateDebut: { lte: endYear },
    //       dateFin: { gte: startYear },
    //     },
    //   });

    //   if (existingActive) {
    //     throw new BadRequestException('Vous avez déjà un abonnement annuel actif ou en attente pour l\'année en cours.');
    //   }
    // }
  }
}

