import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommandesService {
  constructor(private prisma: PrismaService) {}

  async createFromContact(
    utilisateurId: string,
    demandeId: string,
    prestataireId: string,
  ) {
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
    });

    if (!demande) {
      throw new NotFoundException('Demande non trouvée');
    }

    if (demande.utilisateurId !== utilisateurId) {
      throw new BadRequestException('Cette demande ne vous appartient pas');
    }

    // Vérifier si une commande existe déjà
    const existingCommande = await this.prisma.commande.findFirst({
      where: {
        demandeId,
        prestataireId,
      },
    });

    if (existingCommande) {
      return existingCommande;
    }

    // Mettre à jour le statut de la demande
    await this.prisma.demande.update({
      where: { id: demandeId },
      data: { statut: 'ACCEPTEE' },
    });

    // Créer une commande EN_COURS
    const commande = await this.prisma.commande.create({
      data: {
        demandeId,
        prestataireId,
        utilisateurId,
        statut: 'EN_COURS',
        prix: 0,
      },
      include: {
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
    });

    return commande;
  }

  async autoCreateCommande(
    utilisateurId: string,
    demandeId: string,
    prestataireId: string,
  ) {
    // Vérifier que la demande existe et appartient à l'utilisateur
    const demande = await this.prisma.demande.findUnique({
      where: { id: demandeId },
    });

    if (!demande) {
      throw new NotFoundException('Demande non trouvée');
    }

    if (demande.utilisateurId !== utilisateurId) {
      throw new BadRequestException('Cette demande ne vous appartient pas');
    }

    // Vérifier qu'il n'y a pas déjà une commande pour cette demande avec ce prestataire
    const existingCommande = await this.prisma.commande.findFirst({
      where: {
        demandeId,
        prestataireId,
      },
    });

    if (existingCommande) {
      return existingCommande; // Retourner la commande existante
    }

    // Mettre à jour la demande
    await this.prisma.demande.update({
      where: { id: demandeId },
      data: { statut: 'ACCEPTEE' },
    });

    // Créer la commande directement en statut TERMINEE pour permettre l'avis
    const commande = await this.prisma.commande.create({
      data: {
        demandeId,
        prestataireId,
        utilisateurId,
        statut: 'TERMINEE',
        prix: 0, // Prix symbolique pour un contact
      },
      include: {
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
    });

    return commande;
  }

  async getCommandesForUser(utilisateurId: string) {
    return this.prisma.commande.findMany({
      where: { utilisateurId },
      include: {
        prestataire: {
          select: {
            raisonSociale: true,
            logoUrl: true,
            user: {
              select: {
                phone: true,
                address: true,
              },
            },
          },
        },
        demande: {
          include: {
            service: true,
          },
        },
        avis: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCommandesForPrestataire(userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    return this.prisma.commande.findMany({
      where: { prestataireId: prestataire.id },
      include: {
        utilisateur: {
          select: {
            phone: true,
            email: true,
            address: true,
          },
        },
        demande: {
          include: {
            service: true,
          },
        },
        avis: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllForAdmin() {
    return this.prisma.commande.findMany({
      include: {
        utilisateur: {
          select: {
            id: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        prestataire: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        demande: {
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
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      include: {
        prestataire: {
          select: {
            raisonSociale: true,
            logoUrl: true,
            user: {
              select: {
                phone: true,
                address: true,
              },
            },
          },
        },
        utilisateur: {
          select: {
            phone: true,
            email: true,
            address: true,
          },
        },
        demande: {
          include: {
            service: true,
          },
        },
        avis: true,
      },
    });

    if (!commande) {
      throw new NotFoundException('Commande non trouvée');
    }

    return commande;
  }

  async terminerCommande(commandeId: string, userId: string) {
    // Vérifier que la commande appartient au client
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
    });

    if (!commande) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (commande.utilisateurId !== userId) {
      throw new BadRequestException('Cette commande ne vous appartient pas');
    }

    // Mettre à jour le statut à TERMINEE
    return this.prisma.commande.update({
      where: { id: commandeId },
      data: { statut: 'TERMINEE' },
      include: {
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
    });
  }

  async updateStatus(commandeId: string, statut: string, userId: string) {
    const prestataire = await this.prisma.prestataire.findUnique({
      where: { userId },
    });

    if (!prestataire) {
      throw new NotFoundException('Profil prestataire non trouvé');
    }

    return this.prisma.commande.update({
      where: {
        id: commandeId,
        prestataireId: prestataire.id, // Vérifier que c'est bien sa commande
      },
      data: { statut: statut as any },
    });
  }

  async getCommandesRecentPourPrestataire(prestataireId: string) {
    return this.prisma.commande.findMany({
      where: {
        prestataireId,
        statut: 'TERMINEE',
      },
      include: {
        demande: {
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
        avis: {
          select: {
            note: true,
            commentaire: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5, // Les 5 dernières prestations
    });
  }
}
