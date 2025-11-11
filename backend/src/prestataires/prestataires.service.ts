import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrestataireDto } from './dto/create-prestataire.dto';
import { UpdatePrestataireDto } from './dto/update-prestataire.dto';
import { SearchPrestatairesDto, SortOrder } from './dto/search-prestataires.dto';
import { UserRole } from '@prisma/client';
import { CustomServiceDto } from './dto/custom-service.dto';

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

  private async createCustomServices(prestataireId: string, customServices: CustomServiceDto[]) {
    for (const custom of customServices) {
      if (!custom?.nom || !custom.sousSecteurId) {
        continue;
      }

      const baseSlug = generateSlug(custom.nom);
      let slug = baseSlug;
      let attempt = 1;

      while (await this.prisma.service.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${attempt}`;
        attempt += 1;
      }

      const service = await this.prisma.service.create({
        data: {
          nom: custom.nom,
          slug,
          sousSecteurId: custom.sousSecteurId,
          actif: true,
        },
      });

      await this.prisma.prestataireService.create({
        data: {
          prestataireId,
          serviceId: service.id,
        },
      });
    }
  }
}

