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
      abonnementsEnAttente,
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
      // Abonnements en attente d'activation
      this.prisma.abonnement.count({ 
        where: { 
          statut: 'EN_ATTENTE'
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
      abonnementsEnAttente,
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

  async getStatsByPeriod(period: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        // Aujourd'hui (depuis minuit)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        // Cette semaine (depuis lundi)
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajuster pour lundi
        startDate = new Date(now);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // Ce mois (depuis le 1er du mois)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      nouveauxUtilisateurs,
      nouveauxPrestataires,
      nouvellesDemandes,
      nouvellesCommandes,
      commandesTerminees,
      nouveauxAbonnements,
      paiementsValides,
      paiementsEnAttente,
    ] = await Promise.all([
      // Nouveaux utilisateurs dans la période
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Nouveaux prestataires dans la période
      this.prisma.prestataire.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Nouvelles demandes dans la période
      this.prisma.demande.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Nouvelles commandes dans la période
      this.prisma.commande.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Commandes terminées dans la période
      this.prisma.commande.findMany({
        where: {
          statut: 'TERMINEE',
          updatedAt: { gte: startDate },
        },
        select: { prix: true },
      }),
      // Nouveaux abonnements dans la période
      this.prisma.abonnement.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Paiements validés dans la période
      this.prisma.paiement.findMany({
        where: {
          statut: 'VALIDE',
          dateValidation: { gte: startDate },
        },
        select: { montant: true },
      }),
      // Paiements en attente créés dans la période
      this.prisma.paiement.count({
        where: {
          statut: 'EN_ATTENTE',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const caCommandes = commandesTerminees.reduce((sum, cmd) => sum + (cmd.prix || 0), 0);
    const caAbonnements = paiementsValides.reduce((sum, p) => sum + (p.montant || 0), 0);
    const chiffreAffaire = caCommandes + caAbonnements;

    return {
      period,
      startDate,
      endDate: now,
      nouveauxUtilisateurs,
      nouveauxPrestataires,
      nouvellesDemandes,
      nouvellesCommandes,
      commandesTerminees: commandesTerminees.length,
      nouveauxAbonnements,
      paiementsValides: paiementsValides.length,
      paiementsEnAttente,
      chiffreAffaire,
      // Stats cumulées (toujours depuis le début)
      totalUtilisateurs: await this.prisma.user.count({ where: { actif: true } }),
      totalPrestataires: await this.prisma.prestataire.count({
        where: {
          user: { actif: true },
          abonnementActif: true,
          disponibilite: true,
        },
      }),
      totalAbonnementsActifs: await this.prisma.abonnement.count({
        where: {
          statut: 'ACTIF',
          dateFin: { gte: now },
        },
      }),
      totalCommandesEnCours: await this.prisma.commande.count({
        where: {
          statut: { in: ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'] },
        },
      }),
      totalDemandesActives: await this.prisma.demande.count({
        where: { statut: 'EN_ATTENTE' },
      }),
      // Pour compatibilité avec le frontend
      abonnementsActifs: await this.prisma.abonnement.count({
        where: {
          statut: 'ACTIF',
          dateFin: { gte: now },
        },
      }),
      commandesEnCours: await this.prisma.commande.count({
        where: {
          statut: { in: ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'] },
        },
      }),
      demandesActives: await this.prisma.demande.count({
        where: { statut: 'EN_ATTENTE' },
      }),
      prestatairesPendingKyc: await this.prisma.prestataire.count({
        where: {
          kycStatut: 'EN_ATTENTE',
          user: { actif: true },
        },
      }),
      paiementsPendingValidation: await this.prisma.paiement.count({
        where: {
          statut: 'EN_ATTENTE',
          methode: { in: ['ESPECES', 'WAVE'] },
        },
      }),
      abonnementsEnAttente: await this.prisma.abonnement.count({
        where: {
          statut: 'EN_ATTENTE',
        },
      }),
      chiffreAffaireTotal: await this.getGlobalStats().then(s => s.chiffreAffaireTotal),
    };
  }

  async getChartData(period?: 'daily' | 'weekly' | 'monthly') {
    const now = new Date();
    
    // Déterminer la période de données selon le filtre
    let startDate: Date;
    let daysToShow = 30;
    let description = '30 derniers jours';
    
    if (period) {
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          daysToShow = 1;
          description = 'Aujourd\'hui';
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(now);
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          daysToShow = 7;
          description = 'Cette semaine';
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          daysToShow = now.getDate(); // Jours écoulés dans le mois
          description = 'Ce mois';
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const thirtyDaysAgo = startDate;

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
    const startLoop = period === 'daily' ? 0 : (period === 'weekly' ? 6 : (period === 'monthly' ? daysToShow - 1 : 29));
    for (let i = startLoop; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'monthly') {
        date.setDate(i + 1); // Jours du mois
      } else {
        date.setDate(date.getDate() - i);
      }
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

    // CA par période (adapté selon le filtre)
    let revenuePeriodStart: Date;
    let revenueData: Record<string, { month: string; abonnements: number; commandes: number; total: number }> = {};
    
    if (period === 'daily') {
      // Pour le quotidien, on groupe par heures de la journée
      revenuePeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let h = 0; h < 24; h++) {
        const hourKey = `${h}h`;
        revenueData[hourKey] = {
          month: `${h}h`,
          abonnements: 0,
          commandes: 0,
          total: 0,
        };
      }
    } else if (period === 'weekly') {
      // Pour la semaine, on groupe par jour
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      revenuePeriodStart = new Date(now);
      revenuePeriodStart.setDate(diff);
      revenuePeriodStart.setHours(0, 0, 0, 0);
      
      const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      for (let d = 0; d < 7; d++) {
        const date = new Date(revenuePeriodStart);
        date.setDate(date.getDate() + d);
        const dateKey = date.toISOString().split('T')[0];
        revenueData[dateKey] = {
          month: daysOfWeek[d],
          abonnements: 0,
          commandes: 0,
          total: 0,
        };
      }
    } else if (period === 'monthly') {
      // Pour le mois, on groupe par semaine
      revenuePeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weeksInMonth = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 0).getDay()) / 7);
      for (let w = 0; w < weeksInMonth; w++) {
        const weekKey = `Semaine ${w + 1}`;
        revenueData[weekKey] = {
          month: weekKey,
          abonnements: 0,
          commandes: 0,
          total: 0,
        };
      }
    } else {
      // Par défaut : 6 derniers mois
      revenuePeriodStart = new Date(now);
      revenuePeriodStart.setMonth(revenuePeriodStart.getMonth() - 6);
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthNum = date.getMonth() + 1;
        const monthKey = `${date.getFullYear()}-${monthNum < 10 ? '0' : ''}${monthNum}`;
        const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        revenueData[monthKey] = {
          month: monthLabel,
          abonnements: 0,
          commandes: 0,
          total: 0,
        };
      }
    }
    
    const paiementsByMonth = await this.prisma.paiement.findMany({
      where: {
        statut: 'VALIDE',
        createdAt: { gte: revenuePeriodStart },
      },
      select: {
        createdAt: true,
        montant: true,
      },
    });

    const commandesByMonth = await this.prisma.commande.findMany({
      where: {
        statut: 'TERMINEE',
        createdAt: { gte: revenuePeriodStart },
      },
      select: {
        createdAt: true,
        prix: true,
      },
    });

    const monthlyRevenue = revenueData;

    if (period === 'daily') {
      // Grouper par heure
      paiementsByMonth.forEach((p) => {
        const hour = p.createdAt.getHours();
        const hourKey = `${hour}h`;
        if (monthlyRevenue[hourKey]) {
          monthlyRevenue[hourKey].abonnements += p.montant || 0;
        }
      });
      commandesByMonth.forEach((c) => {
        const hour = c.createdAt.getHours();
        const hourKey = `${hour}h`;
        if (monthlyRevenue[hourKey]) {
          monthlyRevenue[hourKey].commandes += c.prix || 0;
        }
      });
    } else if (period === 'weekly') {
      // Grouper par jour de la semaine
      paiementsByMonth.forEach((p) => {
        const dateKey = p.createdAt.toISOString().split('T')[0];
        if (monthlyRevenue[dateKey]) {
          monthlyRevenue[dateKey].abonnements += p.montant || 0;
        }
      });
      commandesByMonth.forEach((c) => {
        const dateKey = c.createdAt.toISOString().split('T')[0];
        if (monthlyRevenue[dateKey]) {
          monthlyRevenue[dateKey].commandes += c.prix || 0;
        }
      });
    } else if (period === 'monthly') {
      // Grouper par semaine du mois
      paiementsByMonth.forEach((p) => {
        const weekNum = Math.floor((p.createdAt.getDate() - 1) / 7);
        const weekKey = `Semaine ${weekNum + 1}`;
        if (monthlyRevenue[weekKey]) {
          monthlyRevenue[weekKey].abonnements += p.montant || 0;
        }
      });
      commandesByMonth.forEach((c) => {
        const weekNum = Math.floor((c.createdAt.getDate() - 1) / 7);
        const weekKey = `Semaine ${weekNum + 1}`;
        if (monthlyRevenue[weekKey]) {
          monthlyRevenue[weekKey].commandes += c.prix || 0;
        }
      });
    } else {
      // Par défaut : par mois
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
    }

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

  async getAbonnementsEnAttente() {
    const abonnements = await this.prisma.abonnement.findMany({
      where: {
        statut: 'EN_ATTENTE',
      },
      include: {
        prestataire: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        plan: true,
        paiements: {
          where: {
            statut: 'EN_ATTENTE',
            methode: { in: ['WAVE', 'ESPECES'] },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filtrer pour ne retourner que les abonnements qui ont au moins un paiement en attente
    return abonnements.filter(ab => ab.paiements && ab.paiements.length > 0);
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

  async supprimerAbonnementsSansPaiement() {
    // Trouver tous les abonnements qui n'ont aucun paiement associé
    const abonnementsSansPaiement = await this.prisma.abonnement.findMany({
      where: {
        paiements: {
          none: {},
        },
      },
      include: {
        prestataire: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
      },
    });

    // Supprimer ces abonnements
    const result = await this.prisma.abonnement.deleteMany({
      where: {
        paiements: {
          none: {},
        },
      },
    });

    return {
      nombreSupprime: result.count,
      abonnements: abonnementsSansPaiement.map((a) => ({
        id: a.id,
        prestataire: a.prestataire?.raisonSociale || 'N/A',
        type: a.type,
        statut: a.statut,
        createdAt: a.createdAt,
      })),
    };
  }

  async supprimerCommandesAnciennes() {
    // Calculer le début du mois en cours
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    debutMois.setHours(0, 0, 0, 0);

    // Trouver toutes les commandes créées avant le début du mois en cours
    const commandesAnciennes = await this.prisma.commande.findMany({
      where: {
        createdAt: {
          lt: debutMois,
        },
      },
      include: {
        demande: {
          include: {
            utilisateur: {
              select: {
                phone: true,
              },
            },
          },
        },
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Compter les commandes par statut
    const parStatut = commandesAnciennes.reduce((acc, cmd) => {
      acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Supprimer ces commandes
    const result = await this.prisma.commande.deleteMany({
      where: {
        createdAt: {
          lt: debutMois,
        },
      },
    });

    // Compter les commandes restantes
    const commandesRestantes = await this.prisma.commande.count({
      where: {
        createdAt: {
          gte: debutMois,
        },
      },
    });

    return {
      nombreSupprime: result.count,
      dateLimite: debutMois,
      repartitionParStatut: parStatut,
      commandesRestantes,
      commandes: commandesAnciennes.slice(0, 50).map((c) => ({
        id: c.id,
        client: c.demande?.utilisateur?.phone || 'N/A',
        prestataire: c.prestataire?.raisonSociale || 'N/A',
        statut: c.statut,
        createdAt: c.createdAt,
      })),
    };
  }
}
