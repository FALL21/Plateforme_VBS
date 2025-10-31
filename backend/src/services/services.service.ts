import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(sousSecteurId?: string) {
    return this.prisma.service.findMany({
      where: {
        actif: true,
        ...(sousSecteurId && { sousSecteurId }),
      },
      include: {
        sousSecteur: {
          include: {
            secteur: true,
          },
        },
      },
      orderBy: {
        nom: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        sousSecteur: {
          include: {
            secteur: true,
          },
        },
      },
    });
  }
}

