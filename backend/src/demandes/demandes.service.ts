import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DemandesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.demande.create({
      data,
      include: {
        service: true,
        utilisateur: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(utilisateurId: string) {
    return this.prisma.demande.findMany({
      where: { utilisateurId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.demande.findMany({
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
        utilisateur: {
          select: {
            id: true,
            phone: true,
            email: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const demande = await this.prisma.demande.findUnique({
      where: { id },
      include: {
        service: true,
        utilisateur: {
          select: {
            phone: true,
            email: true,
            address: true,
          },
        },
      },
    });

    if (!demande) {
      throw new NotFoundException('Demande non trouvée');
    }

    return demande;
  }

  async getDemandesForPrestataire(userId: string) {
    // Récupérer le prestataire
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
      include: {
        prestataireServices: {
          select: { serviceId: true },
        },
      },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    const serviceIds = prestataire.prestataireServices.map(ps => ps.serviceId);

    // Récupérer les demandes pour ces services
    return this.prisma.demande.findMany({
      where: {
        serviceId: { in: serviceIds },
      },
      include: {
        service: true,
        utilisateur: {
          select: {
            phone: true,
            email: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptDemande(demandeId: string, userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    const demande = await this.prisma.demande.update({
      where: { id: demandeId },
      data: { statut: 'ACCEPTEE' },
    });

    // Créer une commande
    await this.prisma.commande.create({
      data: {
        demandeId: demande.id,
        prestataireId: prestataire.id,
        utilisateurId: demande.utilisateurId,
        statut: 'EN_ATTENTE',
      },
    });

    return demande;
  }

  async refuseDemande(demandeId: string, userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    return this.prisma.demande.update({
      where: { id: demandeId },
      data: { statut: 'REFUSEE' },
    });
  }
}
