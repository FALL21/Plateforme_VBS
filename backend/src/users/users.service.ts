import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
    return this.prisma.user.update({
      where: { id },
      data: dto,
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
  }

  // ============ ADMIN METHODS ============

  async findAll(filters?: { role?: string; search?: string }) {
    const where: any = {};

    if (filters?.role && filters.role !== 'ALL') {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        actif: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        prestataire: {
          select: {
            id: true,
            raisonSociale: true,
            kycStatut: true,
            disponibilite: true,
            noteMoyenne: true,
            nombreAvis: true,
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

