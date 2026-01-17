import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrestataireDto } from './dto/create-prestataire.dto';
import { UpdatePrestataireDto } from './dto/update-prestataire.dto';
import { SearchPrestatairesDto, SortOrder } from './dto/search-prestataires.dto';
import { UserRole } from '@prisma/client';
import { CustomServiceDto } from './dto/custom-service.dto';
import { CreatePrestataireWorkDto } from './dto/create-prestataire-work.dto';

const sanitizeEmail = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
};

const normalizePhone = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  let phone = value.trim();
  if (!phone) return undefined;
  phone = phone.replace(/[^0-9+]/g, '');
  if (!phone) return undefined;
  if (phone.startsWith('00')) {
    phone = `+${phone.slice(2)}`;
  }
  if (!phone.startsWith('+')) {
    if (phone.startsWith('0')) {
      phone = phone.slice(1);
    }
    phone = `+221${phone}`;
  }
  return phone;
};

const generateSlug = (input: string): string => {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || `service-${Date.now()}`
  );
};

@Injectable()
export class PrestatairesService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        prestataireServices: {
          include: {
            service: {
              include: {
                sousSecteur: {
                  include: {
                    secteur: true,
                  },
                },
              },
            },
          },
        },
        abonnements: {
          where: { statut: 'ACTIF' },
          include: { plan: true },
          take: 1,
          orderBy: { dateFin: 'desc' },
        },
        travauxRecents: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    return prestataire;
  }

  async updateDisponibilite(userId: string, disponibilite: boolean) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    return this.prisma.prestataire.update({
      where: { id: prestataire.id },
      data: { disponibilite },
    });
  }

  async toggleAbonnement(prestataireId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { id: prestataireId },
      include: {
        abonnements: {
          where: {
            statut: 'ACTIF',
          },
          orderBy: { dateFin: 'desc' },
          take: 1,
        },
      },
    });

    if (!prestataire) {
      throw new NotFoundException('Prestataire non trouvé');
    }

    const newStatus = !prestataire.abonnementActif;

    // Si on active l'abonnement et qu'il n'y a pas d'abonnement actif, créer un abonnement mensuel par défaut
    if (newStatus && prestataire.abonnements.length === 0) {
      // Récupérer le plan mensuel par défaut
      const planMensuel = await this.prisma.planAbonnement.findFirst({
        where: {
          type: 'MENSUEL',
          actif: true,
        },
        orderBy: { prix: 'asc' },
      });

      // Calculer les dates (1 mois)
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setMonth(dateFin.getMonth() + 1);

      // Créer l'abonnement mensuel
      await this.prisma.abonnement.create({
        data: {
          prestataireId: prestataire.id,
          planId: planMensuel?.id,
          type: 'MENSUEL',
          dateDebut,
          dateFin,
          statut: 'ACTIF', // Activé directement par l'admin
          tarif: planMensuel?.prix || 10000, // Prix par défaut si pas de plan trouvé
        },
      });
    }

    return this.prisma.prestataire.update({
      where: { id: prestataireId },
      data: { 
        abonnementActif: newStatus,
        disponibilite: newStatus ? true : prestataire.disponibilite, // Si on active l'abonnement, on active aussi la disponibilité
      },
    });
  }

  async create(userId: string, dto: CreatePrestataireDto) {
    const { serviceIds, customServices, address, latitude, longitude, email, phone, ...prestataireData } = dto;

    const prestataire = await this.prisma.prestataire.create({
      data: {
        userId,
        raisonSociale: prestataireData.raisonSociale,
        description: prestataireData.description,
        logoUrl: prestataireData.logoUrl,
      },
    });

    const normalizedPhone = normalizePhone(phone);
    const sanitizedEmail = sanitizeEmail(email);

    const userUpdateData: Record<string, unknown> = {
      role: UserRole.PRESTATAIRE,
    };

    if (address !== undefined) userUpdateData.address = address;
    if (latitude !== undefined) userUpdateData.latitude = latitude;
    if (longitude !== undefined) userUpdateData.longitude = longitude;
    if (sanitizedEmail) userUpdateData.email = sanitizedEmail;
    if (normalizedPhone) userUpdateData.phone = normalizedPhone;

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    if (serviceIds && serviceIds.length > 0) {
      await Promise.all(
        serviceIds.map((serviceId) =>
          this.prisma.prestataireService.create({
            data: {
              prestataireId: prestataire.id,
              serviceId,
            },
          }),
        ),
      );
    }

    if (customServices && customServices.length > 0) {
      await this.createCustomServices(prestataire.id, customServices);
    }

    return this.prisma.prestataire.findUnique({
      where: { id: prestataire.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        prestataireServices: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async search(dto: SearchPrestatairesDto) {
    const { serviceId, sousSecteurId, secteurId, search, lat, lng, rayon = 10, tri = SortOrder.DISTANCE, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Construire la requête de base
    const where: any = {
      abonnementActif: true, // Seulement les prestataires avec abonnement actif
      kycStatut: 'VALIDE',
      disponibilite: true,
      user: {
        actif: true, // Seulement les prestataires dont le compte est actif
      },
    };
    
    if (search && search.trim().length > 0) {
      const q = search.trim();
      try {
        // Accent-insensitive search using Postgres unaccent extension
        // Fallback to case-insensitive contains if unaccent is unavailable
        const likeParam = `%${q}%`;
        const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
          `
          SELECT p.id
          FROM prestataires p
          LEFT JOIN users u ON u.id = p."userId"
          WHERE (
            unaccent(lower(p."raisonSociale")) LIKE unaccent(lower($1)) OR
            unaccent(lower(COALESCE(p.description, ''))) LIKE unaccent(lower($1)) OR
            unaccent(lower(COALESCE(u.address, ''))) LIKE unaccent(lower($1))
          )
          LIMIT 500
        `,
          likeParam,
        );

        const ids = rows.map((r) => r.id);
        if (ids.length > 0) {
          where.id = { in: ids };
        } else {
          // No match → ensure empty result quickly
          where.id = { in: ['__no_match__'] } as any;
        }
      } catch (e) {
        // Fallback without unaccent
        const fallback = q;
        where.AND = [
          {
            OR: [
              { raisonSociale: { contains: fallback, mode: 'insensitive' } },
              { description: { contains: fallback, mode: 'insensitive' } },
              { user: { address: { contains: fallback, mode: 'insensitive' } } },
            ],
          },
        ];
      }
    }

    if (serviceId) {
      where.prestataireServices = {
        some: {
          serviceId,
          actif: true,
        },
      };
    }

    if (sousSecteurId) {
      where.prestataireServices = {
        some: {
          actif: true,
          service: { sousSecteurId },
        },
      };
    }

    if (secteurId) {
      where.prestataireServices = {
        some: {
          actif: true,
          service: { sousSecteur: { secteurId } },
        },
      };
    }

    // Recherche géolocalisée avec PostGIS
    let orderBy: any = {};
    if (lat && lng) {
      // Calcul de distance avec PostGIS (à implémenter selon votre setup PostGIS)
      // Pour l'instant, on trie par note moyenne
      orderBy = { noteMoyenne: 'desc' };
    } else {
      // Tri par défaut
      switch (tri) {
        case SortOrder.NOTE:
          orderBy = { noteMoyenne: 'desc' };
          break;
        case SortOrder.RECENT:
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { noteMoyenne: 'desc' };
      }
    }

    const [prestataires, total] = await Promise.all([
      this.prisma.prestataire.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          prestataireServices: {
            include: {
              service: true,
            },
            where: {
              actif: true,
            },
          },
          _count: {
            select: {
              avis: true,
            },
          },
        },
      }),
      this.prisma.prestataire.count({ where }),
    ]);

    return {
      data: prestataires,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const prestataire = await this.prisma.prestataire.findFirst({
      where: { 
        id,
        user: {
          actif: true, // Vérifier que le compte est actif
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            actif: true,
          },
        },
        prestataireServices: {
          include: {
            service: {
              include: {
                sousSecteur: {
                  include: {
                    secteur: true,
                  },
                },
              },
            },
          },
          where: {
            actif: true,
          },
        },
        avis: {
          where: {
            visible: true,
          },
          include: {
            utilisateur: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            avis: true,
          },
        },
        travauxRecents: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!prestataire) {
      throw new NotFoundException(`Prestataire avec l'ID ${id} non trouvé`);
    }

    return prestataire;
  }

  async findMyPrestataire(userId: string) {
    return this.prisma.prestataire.findUnique({
      where: { userId },
      include: {
        prestataireServices: {
          include: {
            service: true,
          },
        },
        abonnements: {
          where: {
            statut: 'ACTIF',
          },
          include: {
            plan: true,
          },
          take: 1,
        },
        travauxRecents: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });
  }

  async updateByUserId(userId: string, dto: UpdatePrestataireDto) {
    const prestataire = await this.prisma.prestataire.findUnique({ where: { userId } });
    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }
    const { address, latitude, longitude, email, phone, ...prestataireData } = dto;

    const result = await this.prisma.prestataire.update({
      where: { id: prestataire.id },
      data: prestataireData,
    });

    const normalizedPhone = normalizePhone(phone);
    const sanitizedEmail = sanitizeEmail(email);

    const userUpdateData: Record<string, unknown> = {};

    if (address !== undefined) userUpdateData.address = address;
    if (latitude !== undefined) userUpdateData.latitude = latitude;
    if (longitude !== undefined) userUpdateData.longitude = longitude;
    if (sanitizedEmail !== undefined) userUpdateData.email = sanitizedEmail;
    if (normalizedPhone !== undefined) userUpdateData.phone = normalizedPhone;

    if (Object.keys(userUpdateData).length > 0) {
      userUpdateData.role = UserRole.PRESTATAIRE;
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    return this.prisma.prestataire.findUnique({
      where: { id: result.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        prestataireServices: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async updateServices(userId: string, serviceIds: string[]) {
    const prestataire = await this.prisma.prestataire.findUnique({ where: { userId } });
    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    // Vérifier que tous les services existent et sont actifs
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        actif: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Un ou plusieurs services sont invalides ou inactifs');
    }

    // Supprimer les services existants
    await this.prisma.prestataireService.deleteMany({
      where: { prestataireId: prestataire.id },
    });

    // Créer les nouveaux services
    if (serviceIds.length > 0) {
      await this.prisma.prestataireService.createMany({
        data: serviceIds.map((serviceId) => ({
          prestataireId: prestataire.id,
          serviceId,
        })),
      });
    }

    return this.prisma.prestataire.findUnique({
      where: { id: prestataire.id },
      include: {
        prestataireServices: {
          include: {
            service: {
              include: {
                sousSecteur: {
                  include: {
                    secteur: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async createCustomServices(prestataireId: string, customServices: CustomServiceDto[]) {
    for (const custom of customServices) {
      if (!custom?.nom || !custom.sousSecteurId) {
        continue;
      }

      // Normaliser le nom du service pour la comparaison (insensible à la casse et aux accents)
      const normalizedNom = custom.nom.trim().toLowerCase();

      // Vérifier si un service avec le même nom existe déjà dans le même sous-secteur
      let service = await this.prisma.service.findFirst({
        where: {
          sousSecteurId: custom.sousSecteurId,
          nom: {
            equals: custom.nom,
            mode: 'insensitive', // Comparaison insensible à la casse
          },
        },
      });

      // Si le service n'existe pas, le créer
      if (!service) {
        const baseSlug = generateSlug(custom.nom);
        let slug = baseSlug;
        let attempt = 1;

        while (await this.prisma.service.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${attempt}`;
          attempt += 1;
        }

        service = await this.prisma.service.create({
          data: {
            nom: custom.nom,
            slug,
            sousSecteurId: custom.sousSecteurId,
            actif: true,
          },
        });
      }

      // Vérifier si le prestataire n'a pas déjà ce service associé
      const existingPrestataireService = await this.prisma.prestataireService.findFirst({
        where: {
          prestataireId,
          serviceId: service.id,
        },
      });

      // Associer le service au prestataire seulement s'il n'est pas déjà associé
      if (!existingPrestataireService) {
        await this.prisma.prestataireService.create({
          data: {
            prestataireId,
            serviceId: service.id,
          },
        });
      }
    }
  }

  async addTravailRecent(userId: string, dto: CreatePrestataireWorkDto) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    if (!dto.imageUrl) {
      throw new ForbiddenException("L'URL de l'image est obligatoire");
    }

    await this.prisma.prestataireWork.create({
      data: {
        prestataireId: prestataire.id,
        imageUrl: dto.imageUrl,
        titre: dto.titre,
        description: dto.description,
      },
    });

    // Retourner la liste mise à jour des travaux récents
    return this.prisma.prestataireWork.findMany({
      where: { prestataireId: prestataire.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  async deleteTravailRecent(userId: string, travailId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    // Vérifier que le travail appartient bien au prestataire
    const travail = await this.prisma.prestataireWork.findFirst({
      where: {
        id: travailId,
        prestataireId: prestataire.id,
      },
    });

    if (!travail) {
      throw new NotFoundException('Travail récent non trouvé');
    }

    await this.prisma.prestataireWork.delete({
      where: { id: travailId },
    });

    // Retourner la liste mise à jour des travaux récents
    return this.prisma.prestataireWork.findMany({
      where: { prestataireId: prestataire.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  async updateTravailRecent(userId: string, travailId: string, dto: CreatePrestataireWorkDto) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    // Vérifier que le travail appartient bien au prestataire
    const travail = await this.prisma.prestataireWork.findFirst({
      where: {
        id: travailId,
        prestataireId: prestataire.id,
      },
    });

    if (!travail) {
      throw new NotFoundException('Travail récent non trouvé');
    }

    if (!dto.imageUrl) {
      throw new ForbiddenException("L'URL de l'image est obligatoire");
    }

    await this.prisma.prestataireWork.update({
      where: { id: travailId },
      data: {
        imageUrl: dto.imageUrl,
        titre: dto.titre,
        description: dto.description,
      },
    });

    // Retourner la liste mise à jour des travaux récents
    return this.prisma.prestataireWork.findMany({
      where: { prestataireId: prestataire.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }

  async getStatsByPeriod(userId: string, period: 'daily' | 'weekly' | 'monthly') {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    const now = new Date();
    let startDate: Date;

    // Déterminer la date de début selon la période
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Récupérer les commandes du prestataire dans la période
    const commandes = await this.prisma.commande.findMany({
      where: {
        prestataireId: prestataire.id,
        createdAt: { gte: startDate },
      },
      include: {
        demande: {
          include: {
            service: true,
          },
        },
      },
    });

    // Statistiques
    const totalCommandes = commandes.length;
    const commandesTerminees = commandes.filter(c => c.statut === 'TERMINEE').length;
    const commandesEnCours = commandes.filter(c => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)).length;
    const commandesAnnulees = commandes.filter(c => c.statut === 'ANNULEE').length;
    const chiffreAffaire = commandes
      .filter(c => c.statut === 'TERMINEE' && c.prix)
      .reduce((sum, c) => sum + (c.prix || 0), 0);

    // Statistiques cumulées (toujours depuis le début)
    const totalCommandesTotal = await this.prisma.commande.count({
      where: { prestataireId: prestataire.id },
    });

    const commandesTermineesTotal = await this.prisma.commande.count({
      where: {
        prestataireId: prestataire.id,
        statut: 'TERMINEE',
      },
    });

    const chiffreAffaireTotal = await this.prisma.commande.aggregate({
      where: {
        prestataireId: prestataire.id,
        statut: 'TERMINEE',
        prix: { not: null },
      },
      _sum: {
        prix: true,
      },
    }).then(result => result._sum.prix || 0);

    return {
      period,
      startDate,
      endDate: now,
      totalCommandes,
      commandesTerminees,
      commandesEnCours,
      commandesAnnulees,
      chiffreAffaire,
      totalCommandesTotal,
      commandesTermineesTotal,
      chiffreAffaireTotal,
    };
  }

  async getChartData(userId: string, period?: 'daily' | 'weekly' | 'monthly') {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    const now = new Date();
    let startDate: Date;
    let daysToShow = 30;

    // Déterminer la période de données selon le filtre
    if (period) {
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          daysToShow = 1;
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(now);
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          daysToShow = 7;
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          daysToShow = now.getDate();
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
      }
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    // Récupérer les commandes dans la période
    const commandes = await this.prisma.commande.findMany({
      where: {
        prestataireId: prestataire.id,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        statut: true,
        prix: true,
        demande: {
          select: {
            service: {
              select: {
                nom: true,
                sousSecteur: {
                  select: {
                    secteur: {
                      select: {
                        nom: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Graphique d'évolution des commandes
    const dailyCommandes: Record<string, { date: string; total: number; terminees: number }> = {};
    const startLoop = period === 'daily' ? 0 : (period === 'weekly' ? 6 : (period === 'monthly' ? daysToShow - 1 : 29));

    for (let i = startLoop; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'monthly') {
        date.setDate(i + 1);
      } else {
        date.setDate(date.getDate() - i);
      }
      const dateStr = date.toISOString().split('T')[0];
      dailyCommandes[dateStr] = {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        total: 0,
        terminees: 0,
      };
    }

    commandes.forEach((commande) => {
      const dateStr = commande.createdAt.toISOString().split('T')[0];
      if (dailyCommandes[dateStr]) {
        dailyCommandes[dateStr].total++;
        if (commande.statut === 'TERMINEE') {
          dailyCommandes[dateStr].terminees++;
        }
      }
    });

    // Répartition par statut
    const commandesByStatut = {
      EN_ATTENTE: commandes.filter(c => c.statut === 'EN_ATTENTE').length,
      ACCEPTEE: commandes.filter(c => c.statut === 'ACCEPTEE').length,
      EN_COURS: commandes.filter(c => c.statut === 'EN_COURS').length,
      TERMINEE: commandes.filter(c => c.statut === 'TERMINEE').length,
      ANNULEE: commandes.filter(c => c.statut === 'ANNULEE').length,
    };

    // Répartition par secteur
    const commandesBySecteur: Record<string, number> = {};
    commandes.forEach((commande) => {
      const secteurNom = commande.demande?.service?.sousSecteur?.secteur?.nom || 'Autre';
      commandesBySecteur[secteurNom] = (commandesBySecteur[secteurNom] || 0) + 1;
    });

    // CA par période (adapté selon le filtre)
    let revenueData: Record<string, { period: string; montant: number }> = {};

    if (period === 'daily') {
      // Pour le quotidien, on groupe par heures de la journée
      for (let h = 0; h < 24; h++) {
        const hourKey = `${h}h`;
        revenueData[hourKey] = {
          period: `${h}h`,
          montant: 0,
        };
      }
      commandes
        .filter(c => c.statut === 'TERMINEE' && c.prix)
        .forEach((commande) => {
          const hour = new Date(commande.createdAt).getHours();
          const hourKey = `${hour}h`;
          if (revenueData[hourKey]) {
            revenueData[hourKey].montant += commande.prix || 0;
          }
        });
    } else if (period === 'weekly') {
      // Pour la semaine, on groupe par jour
      const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        const dateKey = date.toISOString().split('T')[0];
        revenueData[dateKey] = {
          period: daysOfWeek[d],
          montant: 0,
        };
      }
      commandes
        .filter(c => c.statut === 'TERMINEE' && c.prix)
        .forEach((commande) => {
          const dateStr = commande.createdAt.toISOString().split('T')[0];
          if (revenueData[dateStr]) {
            revenueData[dateStr].montant += commande.prix || 0;
          }
        });
    } else if (period === 'monthly') {
      // Pour le mois, on groupe par semaine
      const weeksInMonth = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 0).getDay()) / 7);
      for (let w = 0; w < weeksInMonth; w++) {
        const weekKey = `Semaine ${w + 1}`;
        revenueData[weekKey] = {
          period: weekKey,
          montant: 0,
        };
      }
      commandes
        .filter(c => c.statut === 'TERMINEE' && c.prix)
        .forEach((commande) => {
          const commandeDate = new Date(commande.createdAt);
          const weekNumber = Math.ceil((commandeDate.getDate() + new Date(commandeDate.getFullYear(), commandeDate.getMonth(), 0).getDay()) / 7);
          const weekKey = `Semaine ${weekNumber}`;
          if (revenueData[weekKey]) {
            revenueData[weekKey].montant += commande.prix || 0;
          }
        });
    }

    return {
      dailyCommandes: Object.values(dailyCommandes),
      commandesByStatut,
      commandesBySecteur,
      revenueData: Object.values(revenueData),
    };
  }
}

