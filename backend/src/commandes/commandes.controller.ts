import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandesService } from './commandes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Commandes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post('from-contact')
  @Roles('USER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une commande EN_COURS après un contact téléphonique' })
  async createFromContact(
    @Request() req,
    @Body() body: { demandeId: string; prestataireId: string },
  ) {
    return this.commandesService.createFromContact(
      req.user.id,
      body.demandeId,
      body.prestataireId,
    );
  }

  @Post('auto-create')
  @Roles('USER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer automatiquement une commande terminée pour permettre un avis' })
  async autoCreate(
    @Request() req,
    @Body() body: { demandeId: string; prestataireId: string },
  ) {
    return this.commandesService.autoCreateCommande(
      req.user.id,
      body.demandeId,
      body.prestataireId,
    );
  }

  @Get('mes-commandes')
  @Roles('USER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mes commandes (client)' })
  async getMyCommandes(@Request() req) {
    return this.commandesService.getCommandesForUser(req.user.id);
  }

  @Get('mes-commandes-prestataire')
  @Roles('PRESTATAIRE')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mes commandes (prestataire)' })
  async getMyCommandesPrestataire(@Request() req) {
    return this.commandesService.getCommandesForPrestataire(req.user.id);
  }

  @Patch(':id/terminer')
  @Roles('USER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Marquer une commande comme terminée (client)' })
  async terminerCommande(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.commandesService.terminerCommande(id, req.user.id);
  }

  @Patch(':id/status')
  @Roles('PRESTATAIRE')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { statut: string },
    @Request() req,
  ) {
    return this.commandesService.updateStatus(id, body.statut, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une commande' })
  async findOne(@Param('id') id: string) {
    return this.commandesService.findOne(id);
  }
}
