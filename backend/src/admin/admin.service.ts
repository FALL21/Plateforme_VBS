import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats() {
    const now = new Date();
    
    const [
      totalUtilisateurs,
      totalUtilisateursActifs,
      totalPrestataires,
      prestatairesAvecAbonnementActif,
      prestatairesPendingKyc,
      paiementsPendingValidation,
      demandesActives,
      commandesEnCours,
      abonnementsActifs,
      commandesTerminees,
      paiementsValides,
    ] = await Promise.all([
      // Total de tous les utilisateurs (actifs et inactifs)
      this.prisma.user.count(),
      // Utilisateurs actifs uniquement
      this.prisma.user.count({ where: { actif: true } }),
      // Total de tous les prestataires (même si compte inactif)
      this.prisma.prestataire.count(),
      // Prestataires avec abonnement actif ET compte actif ET disponibilité activée
      this.prisma.prestataire.count({ 
        where: { 
          user: { actif: true },
          abonnementActif: true,
          disponibilite: true,
        } 
      }),
      // Prestataires en attente de validation KYC (compte actif)
      this.prisma.prestataire.count({ 
        where: { 
          kycStatut: 'EN_ATTENTE',
          user: { actif: true }
        } 
      }),
      // Paiements en attente (ESPECES et WAVE)
      this.prisma.paiement.count({ 
        where: { 
          statut: 'EN_ATTENTE', 
          methode: { in: ['ESPECES', 'WAVE'] }
        } 
      }),
      // Demandes actives
      this.prisma.demande.count({ where: { statut: 'EN_ATTENTE' } }),
      // Commandes en cours
      this.prisma.commande.count({ 
        where: { 
          statut: { in: ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'] } 
        } 
      }),
      // Abonnements actifs (statut ACTIF ET dateFin > maintenant)
      this.prisma.abonnement.count({ 
        where: { 
          statut: 'ACTIF',
          dateFin: { gte: now }
        } 
      }),
      // Commandes terminées pour calculer le CA
      this.prisma.commande.findMany({ 
        where: { statut: 'TERMINEE' }, 
        select: { prix: true } 
      }),
      // Paiements validés pour calculer le CA total (abonnements)
      this.prisma.paiement.findMany({
        where: { statut: 'VALIDE' },
        select: { montant: true }
      }),
    ]);

    // CA = commandes terminées + paiements validés (abonnements)
    const caCommandes = commandesTerminees.reduce((sum, cmd) => sum + (cmd.prix || 0), 0);
    const caAbonnements = paiementsValides.reduce((sum, p) => sum + (p.montant || 0), 0);
    const chiffreAffaireTotal = caCommandes + caAbonnements;

    return {
      totalUtilisateurs: totalUtilisateursActifs, // Afficher les utilisateurs actifs dans le dashboard
      totalPrestataires: prestatairesAvecAbonnementActif, // Prestataires vraiment actifs sur la plateforme
      prestatairesPendingKyc,
      paiementsPendingValidation,
      demandesActives,
      commandesEnCours,
      abonnementsActifs,
      chiffreAffaireTotal,
      // Statistiques supplémentaires pour cohérence
      _meta: {
        totalUtilisateursTous: totalUtilisateurs,
        totalPrestatairesTous: totalPrestataires,
        caCommandes,
        caAbonnements,
      },
    };
  }

  async getRecentActivities() {
    const activities = await this.prisma.adminAction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Récupérer les infos des admins en une seule requête
    const adminIds = [...new Set(activities.map(a => a.adminId))];
    const admins = await this.prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true, phone: true },
    });
    const adminMap = new Map(admins.map(a => [a.id, a]));

    // Formater les types d'actions pour un affichage plus lisible
    const formatAction = (type: string, meta: any) => {
      const actionMap: Record<string, string> = {
        'KYC_VALIDE': 'Validation KYC',
        'KYC_REFUSE': 'Refus KYC',
        'PAIEMENT_VALIDE': 'Validation paiement',
        'PAIEMENT_REFUSE': 'Refus paiement',
      };
      
      return actionMap[type] || type;
    };

    return activities.map(a => {
      const admin = adminMap.get(a.adminId);
      const meta = a.meta as any;
      return {
        action: formatAction(a.type, meta),
        description: meta?.motif || a.cibleId || 'Action administrative',
        createdAt: a.createdAt,
        admin: admin?.email || admin?.phone || 'Admin',
        type: a.type,
      };
    });
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
        prestataireServices: {
          include: {
            service: {
              select: {
                nom: true,
                sousSecteur: {
                  select: {
                    nom: true,
                    secteur: { select: { nom: true } },
                  },
                },
              },
            },
          },
        },
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

  async getPaiementsEnAttente() {
    return this.prisma.paiement.findMany({
      where: {
        methode: {
          in: ['ESPECES', 'WAVE'],
        },
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
          data: { abonnementActif: true, disponibilite: true },
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
