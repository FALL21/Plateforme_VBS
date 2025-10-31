import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats() {
    const [
      totalUtilisateurs,
      totalPrestataires,
      prestatairesPendingKyc,
      paiementsPendingValidation,
      demandesActives,
      commandesEnCours,
      abonnementsActifs,
      commandesTerminees,
    ] = await Promise.all([
      // Compter uniquement les utilisateurs actifs
      this.prisma.user.count({ where: { actif: true } }),
      // Compter uniquement les prestataires dont le compte utilisateur est actif
      this.prisma.prestataire.count({ 
        where: { 
          user: { actif: true } 
        } 
      }),
      this.prisma.prestataire.count({ 
        where: { 
          kycStatut: 'EN_ATTENTE',
          user: { actif: true }
        } 
      }),
      this.prisma.paiement.count({ where: { statut: 'EN_ATTENTE', methode: 'ESPECES' } }),
      this.prisma.demande.count({ where: { statut: 'EN_ATTENTE' } }),
      this.prisma.commande.count({ where: { statut: { in: ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'] } } }),
      this.prisma.abonnement.count({ where: { statut: 'ACTIF' } }),
      this.prisma.commande.findMany({ where: { statut: 'TERMINEE' }, select: { prix: true } }),
    ]);

    const chiffreAffaireTotal = commandesTerminees.reduce((sum, cmd) => sum + (cmd.prix || 0), 0);

    return {
      totalUtilisateurs,
      totalPrestataires,
      prestatairesPendingKyc,
      paiementsPendingValidation,
      demandesActives,
      commandesEnCours,
      abonnementsActifs,
      chiffreAffaireTotal,
    };
  }

  async getRecentActivities() {
    const activities = await this.prisma.adminAction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return activities.map(a => ({
      action: a.type,
      description: a.cibleId || '',
      createdAt: a.createdAt,
      admin: a.adminId,
    }));
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        prestataire: {
          select: {
            raisonSociale: true,
            kycStatut: true,
            abonnementActif: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPrestatairesPendingKyc() {
    return this.prisma.prestataire.findMany({
      where: { kycStatut: 'EN_ATTENTE' },
      include: {
        user: { select: { phone: true, email: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateKyc(
    prestataireId: string,
    statut: 'VALIDE' | 'REFUSE',
    adminId: string,
    motif?: string,
  ) {
    const kycStatut = statut === 'REFUSE' ? 'REFUSE' : 'VALIDE';
    
    const prestataire = await this.prisma.prestataire.update({
      where: { id: prestataireId },
      data: { kycStatut: kycStatut as any },
    });

    await this.prisma.adminAction.create({
      data: {
        adminId,
        type: `KYC_${statut}`,
        cibleId: prestataireId,
        meta: { motif: motif || `KYC ${statut === 'VALIDE' ? 'validé' : 'refusé'}` },
      },
    });

    return prestataire;
  }

  async getPaiementsEspecesEnAttente() {
    return this.prisma.paiement.findMany({
      where: {
        methode: 'ESPECES',
        statut: 'EN_ATTENTE',
      },
      include: {
        abonnement: {
          include: {
            plan: true,
            prestataire: {
              select: {
                raisonSociale: true,
                user: { select: { phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validatePaiement(
    paiementId: string,
    statut: 'VALIDE' | 'REFUSE',
    adminId: string,
    motif?: string,
  ) {
    const statutPaiement = statut === 'REFUSE' ? 'REJETE' : 'VALIDE';
    
    const paiement = await this.prisma.paiement.update({
      where: { id: paiementId },
      data: {
        statut: statutPaiement as any,
        dateValidation: new Date(),
      },
    });

    if (statut === 'VALIDE') {
      const abonnement = await this.prisma.abonnement.findUnique({
        where: { id: paiement.abonnementId },
      });

      if (abonnement) {
        await this.prisma.abonnement.update({
          where: { id: abonnement.id },
          data: { statut: 'ACTIF' },
        });

        await this.prisma.prestataire.update({
          where: { id: abonnement.prestataireId },
          data: { abonnementActif: true },
        });
      }
    }

    await this.prisma.adminAction.create({
      data: {
        adminId,
        type: `PAIEMENT_${statut}`,
        cibleId: paiementId,
        meta: { motif: motif || `Paiement ${statut === 'VALIDE' ? 'validé' : 'refusé'}` },
      },
    });

    return paiement;
  }
}
