import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvisService } from './avis.service';
import { CreateAvisDto } from './dto/create-avis.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Avis')
@Controller('avis')
export class AvisController {
  constructor(private readonly avisService: AvisService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un avis pour une commande terminée' })
  async create(@Request() req, @Body() dto: CreateAvisDto) {
    return this.avisService.create(req.user.id, dto);
  }

  @Get('prestataire/:prestataireId')
  @ApiOperation({ summary: 'Récupérer les avis d\'un prestataire' })
  async getAvisForPrestataire(@Param('prestataireId') prestataireId: string) {
    return this.avisService.getAvisForPrestataire(prestataireId);
  }

  @Get('commande/:commandeId')
  @ApiOperation({ summary: 'Récupérer l\'avis d\'une commande' })
  async getAvisForCommande(@Param('commandeId') commandeId: string) {
    return this.avisService.getAvisForCommande(commandeId);
  }
}
