import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvisDto } from './dto/create-avis.dto';

@Injectable()
export class AvisService {
  constructor(private prisma: PrismaService) {}

  async create(utilisateurId: string, dto: CreateAvisDto) {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const commande = await this.prisma.commande.findUnique({
      where: { id: dto.commandeId },
      include: { avis: true },
    });

    if (!commande) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (commande.utilisateurId !== utilisateurId) {
      throw new BadRequestException('Cette commande ne vous appartient pas');
    }

    if (commande.statut !== 'TERMINEE') {
      throw new BadRequestException('Vous ne pouvez donner un avis que sur une commande terminée');
    }

    if (commande.avis) {
      throw new BadRequestException('Un avis a déjà été donné pour cette commande');
    }

    // Créer l'avis
    const avis = await this.prisma.avis.create({
      data: {
        commandeId: dto.commandeId,
        prestataireId: commande.prestataireId,
        utilisateurId,
        note: dto.note,
        commentaire: dto.commentaire,
      },
      include: {
        utilisateur: {
          select: {
            phone: true,
            email: true,
          },
        },
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
    });

    // Mettre à jour la note moyenne du prestataire
    await this.updatePrestataireNote(commande.prestataireId);

    return avis;
  }

  async getAvisForPrestataire(prestataireId: string) {
    return this.prisma.avis.findMany({
      where: {
        prestataireId,
        visible: true,
      },
      include: {
        utilisateur: {
          select: {
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvisForCommande(commandeId: string) {
    return this.prisma.avis.findUnique({
      where: { commandeId },
      include: {
        utilisateur: {
          select: {
            phone: true,
          },
        },
        prestataire: {
          select: {
            raisonSociale: true,
          },
        },
      },
    });
  }

  private async updatePrestataireNote(prestataireId: string) {
    const avis = await this.prisma.avis.findMany({
      where: {
        prestataireId,
        visible: true,
      },
      select: {
        note: true,
      },
    });

    if (avis.length === 0) {
      await this.prisma.prestataire.update({
        where: { id: prestataireId },
        data: {
          noteMoyenne: 0,
          nombreAvis: 0,
        },
      });
      return;
    }

    const noteMoyenne = avis.reduce((sum, a) => sum + a.note, 0) / avis.length;

    await this.prisma.prestataire.update({
      where: { id: prestataireId },
      data: {
        noteMoyenne: Math.round(noteMoyenne * 10) / 10, // Arrondi à 1 décimale
        nombreAvis: avis.length,
      },
    });
  }
}
