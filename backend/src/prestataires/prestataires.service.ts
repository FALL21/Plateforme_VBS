import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrestataireDto } from './dto/create-prestataire.dto';
import { SearchPrestatairesDto, SortOrder } from './dto/search-prestataires.dto';

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

  async create(userId: string, dto: CreatePrestataireDto) {
    const prestataire = await this.prisma.prestataire.create({
      data: {
        userId,
        raisonSociale: dto.raisonSociale,
        description: dto.description,
        logoUrl: dto.logoUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Associer les services si fournis
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      await Promise.all(
        dto.serviceIds.map((serviceId) =>
          this.prisma.prestataireService.create({
            data: {
              prestataireId: prestataire.id,
              serviceId,
            },
          }),
        ),
      );
    }

    return prestataire;
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
      where.AND = [
        {
          OR: [
            { raisonSociale: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { user: { address: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
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
      },
    });
  }
}

