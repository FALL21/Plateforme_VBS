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

  async getChartData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Données pour graphique d'évolution des inscriptions (30 derniers jours)
    const usersByDate = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    // Grouper par date
    const dailyUsers: Record<string, { date: string; users: number; prestataires: number; clients: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyUsers[dateStr] = {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        users: 0,
        prestataires: 0,
        clients: 0,
      };
    }

    usersByDate.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      if (dailyUsers[dateStr]) {
        dailyUsers[dateStr].users++;
        if (user.role === 'PRESTATAIRE') {
          dailyUsers[dateStr].prestataires++;
        } else if (user.role === 'USER') {
          dailyUsers[dateStr].clients++;
        }
      }
    });

    // Répartition des rôles
    const [totalClients, totalPrestataires, totalAdmins] = await Promise.all([
      this.prisma.user.count({ where: { role: 'USER', actif: true } }),
      this.prisma.user.count({ where: { role: 'PRESTATAIRE', actif: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN', actif: true } }),
    ]);

    // Répartition des statuts de commandes
    const commandesByStatut = await this.prisma.commande.groupBy({
      by: ['statut'],
      _count: { statut: true },
    });

    // Répartition des statuts de demandes
    const demandesByStatut = await this.prisma.demande.groupBy({
      by: ['statut'],
      _count: { statut: true },
    });

    // CA par mois (6 derniers mois)
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const paiementsByMonth = await this.prisma.paiement.findMany({
      where: {
        statut: 'VALIDE',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        montant: true,
      },
    });

    const commandesByMonth = await this.prisma.commande.findMany({
      where: {
        statut: 'TERMINEE',
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        prix: true,
      },
    });

    const monthlyRevenue: Record<string, { month: string; abonnements: number; commandes: number; total: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthNum = date.getMonth() + 1;
      const monthKey = `${date.getFullYear()}-${monthNum < 10 ? '0' : ''}${monthNum}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      monthlyRevenue[monthKey] = {
        month: monthLabel,
        abonnements: 0,
        commandes: 0,
        total: 0,
      };
    }

    paiementsByMonth.forEach((p) => {
      const monthNum = p.createdAt.getMonth() + 1;
      const monthKey = `${p.createdAt.getFullYear()}-${monthNum < 10 ? '0' : ''}${monthNum}`;
      if (monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey].abonnements += p.montant || 0;
      }
    });

    commandesByMonth.forEach((c) => {
      const monthNum = c.createdAt.getMonth() + 1;
      const monthKey = `${c.createdAt.getFullYear()}-${monthNum < 10 ? '0' : ''}${monthNum}`;
      if (monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey].commandes += c.prix || 0;
      }
    });

    Object.keys(monthlyRevenue).forEach((key) => {
      monthlyRevenue[key].total = monthlyRevenue[key].abonnements + monthlyRevenue[key].commandes;
    });

    return {
      dailyUsers: Object.values(dailyUsers),
      roleDistribution: [
        { name: 'Clients', value: totalClients, color: '#10b981' },
        { name: 'Prestataires', value: totalPrestataires, color: '#3b82f6' },
        { name: 'Admins', value: totalAdmins, color: '#8b5cf6' },
      ],
      commandesByStatut: commandesByStatut.map((c) => ({
        name: c.statut,
        value: c._count.statut,
      })),
      demandesByStatut: demandesByStatut.map((d) => ({
        name: d.statut,
        value: d._count.statut,
      })),
      monthlyRevenue: Object.values(monthlyRevenue),
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
