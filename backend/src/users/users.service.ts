import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { getCountryConfigByCode } from '../common/countries';

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

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = {};

    if (dto.address !== undefined) {
      data.address = dto.address?.trim() || null;
    }
    if (dto.latitude !== undefined) {
      data.latitude = dto.latitude;
    }
    if (dto.longitude !== undefined) {
      data.longitude = dto.longitude;
    }
    if (dto.email !== undefined) {
      const sanitized = sanitizeEmail(dto.email);
      data.email = sanitized ?? null;
    }
    if (dto.phone !== undefined) {
      const normalized = normalizePhone(dto.phone);
      if (!normalized) {
        throw new BadRequestException('Le numéro de téléphone est invalide.');
      }
      data.phone = normalized;
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('phone')) {
          throw new BadRequestException('Ce numéro de téléphone est déjà associé à un autre compte.');
        }
        if (target?.includes('email')) {
          throw new BadRequestException('Cet email est déjà associé à un autre compte.');
        }
        throw new BadRequestException('Ces informations sont déjà utilisées par un autre compte.');
      }
      throw error;
    }
  }

  // ============ ADMIN METHODS ============

  async findAll(filters?: { role?: string; search?: string; country?: string }) {
    const where: any = {};

    if (filters?.role && filters.role !== 'ALL') {
      where.role = filters.role;
    }

    // Construire les conditions de pays
    let countryCondition: any = null;
    if (filters?.country && filters.country !== 'ALL') {
      const countryConfig = getCountryConfigByCode(filters.country);
      
      if (countryConfig) {
        // Inclure les utilisateurs avec le pays défini OU ceux sans pays mais avec des indices (téléphone ou adresse)
        const phoneCondition = { phone: { startsWith: countryConfig.dialCode } };
        
        // Construire les conditions d'adresse pour ce pays
        const addressConditions = countryConfig.addressKeywords.map(keyword => ({
          address: { contains: keyword, mode: 'insensitive' as const }
        }));
        
        countryCondition = {
          OR: [
            { country: filters.country },
            {
              AND: [
                { country: null },
                {
                  OR: [
                    phoneCondition,
                    ...(addressConditions.length > 0 ? addressConditions : [])
                  ]
                }
              ]
            }
          ]
        };
      } else {
        // Si le pays n'est pas dans la config, utiliser uniquement le champ country
        countryCondition = { country: filters.country };
      }
    }

    // Construire les conditions de recherche
    let searchCondition: any = null;
    if (filters?.search) {
      searchCondition = {
        OR: [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { address: { contains: filters.search, mode: 'insensitive' } },
        ]
      };
    }

    // Combiner toutes les conditions avec AND
    const conditions: any[] = [];
    if (Object.keys(where).length > 0) {
      conditions.push(where);
    }
    if (countryCondition) {
      conditions.push(countryCondition);
    }
    if (searchCondition) {
      conditions.push(searchCondition);
    }

    const finalWhere = conditions.length > 1 ? { AND: conditions } : (conditions[0] || {});

    return this.prisma.user.findMany({
      where: finalWhere,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        actif: true,
        address: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        prestataire: {
          select: {
            id: true,
            raisonSociale: true,
            kycStatut: true,
            abonnementActif: true,
            disponibilite: true,
            noteMoyenne: true,
            nombreAvis: true,
            logoUrl: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneDetailed(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        prestataire: {
          include: {
            prestataireServices: {
              include: {
                service: true,
              },
            },
            abonnements: {
              include: {
                plan: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
            commandes: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
        demandes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  async updateRole(id: string, role: string) {
    // Vérifier que le rôle est valide
    const validRoles = ['USER', 'PRESTATAIRE', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new ForbiddenException(`Rôle invalide: ${role}`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        actif: true,
      },
    });
  }

  async toggleUserStatus(id: string, adminId: string) {
    // Empêcher de désactiver son propre compte
    if (id === adminId) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte');
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, actif: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Inverser le statut actif
    return this.prisma.user.update({
      where: { id },
      data: { actif: !user.actif },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        actif: true,
      },
    });
  }

  async deleteUser(id: string, adminId: string) {
    // Empêcher la suppression de son propre compte
    if (id === adminId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    }

    // Vérifier si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { prestataire: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Si c'est un prestataire, supprimer toutes ses relations
    if (user.prestataire) {
      // Supprimer les avis reçus
      await this.prisma.avis.deleteMany({
        where: { prestataireId: user.prestataire.id },
      });

      // Supprimer les commandes du prestataire
      await this.prisma.commande.deleteMany({
        where: { prestataireId: user.prestataire.id },
      });

      // Supprimer les prestataireServices
      await this.prisma.prestataireService.deleteMany({
        where: { prestataireId: user.prestataire.id },
      });

      // Supprimer les paiements liés aux abonnements
      await this.prisma.paiement.deleteMany({
        where: {
          abonnement: {
            prestataireId: user.prestataire.id,
          },
        },
      });

      // Supprimer les abonnements
      await this.prisma.abonnement.deleteMany({
        where: { prestataireId: user.prestataire.id },
      });
    }

    // Supprimer les demandes effectuées par l'utilisateur (client)
    await this.prisma.demande.deleteMany({
      where: { utilisateurId: id },
    });

    // Supprimer les commandes en tant que client
    await this.prisma.commande.deleteMany({
      where: { utilisateurId: id },
    });

    // Supprimer les actions admin si c'est un admin
    await this.prisma.adminAction.deleteMany({
      where: { adminId: id },
    });

    // Supprimer l'utilisateur
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async getUserStats() {
    const [totalUsers, totalClients, totalPrestataires, totalAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.user.count({ where: { role: 'PRESTATAIRE' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return {
      total: totalUsers,
      clients: totalClients,
      prestataires: totalPrestataires,
      admins: totalAdmins,
    };
  }
}

