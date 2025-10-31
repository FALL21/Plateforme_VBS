import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';
import { CreateSousSecteurDto } from './dto/create-sous-secteur.dto';

@Injectable()
export class SecteursService {
  constructor(private prisma: PrismaService) {}

  // Utilitaire pour générer un slug unique
  private generateSlug(nom: string): string {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères non alphanumériques par des tirets
      .replace(/^-+|-+$/g, ''); // Enlever les tirets au début et à la fin
  }

  async findAll() {
    return this.prisma.secteur.findMany({
      where: { actif: true },
      include: {
        sousSecteurs: {
          where: { actif: true },
        },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const secteur = await this.prisma.secteur.findUnique({
      where: { id },
      include: {
        sousSecteurs: {
          where: { actif: true },
        },
      },
    });

    if (!secteur) {
      throw new NotFoundException(`Secteur avec l'ID ${id} non trouvé`);
    }

    return secteur;
  }

  async findSousSecteurs(secteurId: string) {
    const secteur = await this.findOne(secteurId);
    return secteur.sousSecteurs;
  }

  // ============ ADMIN METHODS ============

  async create(createSecteurDto: CreateSecteurDto) {
    // Vérifier si un secteur avec ce nom existe déjà
    const existingSecteur = await this.prisma.secteur.findFirst({
      where: {
        nom: {
          equals: createSecteurDto.nom,
          mode: 'insensitive',
        },
      },
    });

    if (existingSecteur) {
      throw new ConflictException(`Un secteur avec le nom "${createSecteurDto.nom}" existe déjà`);
    }

    // Générer un slug unique
    let slug = this.generateSlug(createSecteurDto.nom);
    let slugCounter = 1;
    
    // Vérifier l'unicité du slug et ajouter un suffixe si nécessaire
    while (await this.prisma.secteur.findUnique({ where: { slug } })) {
      slug = `${this.generateSlug(createSecteurDto.nom)}-${slugCounter}`;
      slugCounter++;
    }

    return this.prisma.secteur.create({
      data: {
        nom: createSecteurDto.nom,
        slug: slug,
        description: createSecteurDto.description,
        actif: true,
      },
      include: {
        sousSecteurs: true,
      },
    });
  }

  async update(id: string, updateSecteurDto: UpdateSecteurDto) {
    // Vérifier que le secteur existe
    await this.findOne(id);

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (updateSecteurDto.nom) {
      const existingSecteur = await this.prisma.secteur.findFirst({
        where: {
          nom: {
            equals: updateSecteurDto.nom,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (existingSecteur) {
        throw new ConflictException(`Un secteur avec le nom "${updateSecteurDto.nom}" existe déjà`);
      }
    }

    return this.prisma.secteur.update({
      where: { id },
      data: updateSecteurDto,
      include: {
        sousSecteurs: true,
      },
    });
  }

  async remove(id: string) {
    // Vérifier que le secteur existe
    await this.findOne(id);

    // Soft delete: désactiver le secteur et ses sous-secteurs
    await this.prisma.sousSecteur.updateMany({
      where: { secteurId: id },
      data: { actif: false },
    });

    return this.prisma.secteur.update({
      where: { id },
      data: { actif: false },
    });
  }

  async createSousSecteur(createSousSecteurDto: CreateSousSecteurDto) {
    // Vérifier que le secteur parent existe
    const secteur = await this.prisma.secteur.findUnique({
      where: { id: createSousSecteurDto.secteurId },
    });

    if (!secteur) {
      throw new NotFoundException(`Secteur parent avec l'ID ${createSousSecteurDto.secteurId} non trouvé`);
    }

    // Vérifier si un sous-secteur avec ce nom existe déjà dans ce secteur
    const existingSousSecteur = await this.prisma.sousSecteur.findFirst({
      where: {
        nom: {
          equals: createSousSecteurDto.nom,
          mode: 'insensitive',
        },
        secteurId: createSousSecteurDto.secteurId,
      },
    });

    if (existingSousSecteur) {
      throw new ConflictException(
        `Un sous-secteur avec le nom "${createSousSecteurDto.nom}" existe déjà dans ce secteur`,
      );
    }

    // Générer un slug unique
    let slug = this.generateSlug(createSousSecteurDto.nom);
    let slugCounter = 1;
    
    // Vérifier l'unicité du slug et ajouter un suffixe si nécessaire
    while (await this.prisma.sousSecteur.findUnique({ where: { slug } })) {
      slug = `${this.generateSlug(createSousSecteurDto.nom)}-${slugCounter}`;
      slugCounter++;
    }

    return this.prisma.sousSecteur.create({
      data: {
        nom: createSousSecteurDto.nom,
        slug: slug,
        description: createSousSecteurDto.description,
        secteur: {
          connect: { id: createSousSecteurDto.secteurId },
        },
        actif: true,
      },
      include: {
        secteur: true,
      },
    });
  }

  async updateSousSecteur(id: string, updateData: { nom?: string; description?: string; actif?: boolean }) {
    // Vérifier que le sous-secteur existe
    const sousSecteur = await this.prisma.sousSecteur.findUnique({
      where: { id },
    });

    if (!sousSecteur) {
      throw new NotFoundException(`Sous-secteur avec l'ID ${id} non trouvé`);
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà dans le même secteur
    if (updateData.nom) {
      const existingSousSecteur = await this.prisma.sousSecteur.findFirst({
        where: {
          nom: {
            equals: updateData.nom,
            mode: 'insensitive',
          },
          secteurId: sousSecteur.secteurId,
          id: { not: id },
        },
      });

      if (existingSousSecteur) {
        throw new ConflictException(`Un sous-secteur avec le nom "${updateData.nom}" existe déjà dans ce secteur`);
      }
    }

    return this.prisma.sousSecteur.update({
      where: { id },
      data: updateData,
      include: {
        secteur: true,
      },
    });
  }

  async removeSousSecteur(id: string) {
    // Vérifier que le sous-secteur existe
    const sousSecteur = await this.prisma.sousSecteur.findUnique({
      where: { id },
    });

    if (!sousSecteur) {
      throw new NotFoundException(`Sous-secteur avec l'ID ${id} non trouvé`);
    }

    // Soft delete: désactiver le sous-secteur
    return this.prisma.sousSecteur.update({
      where: { id },
      data: { actif: false },
    });
  }
}

