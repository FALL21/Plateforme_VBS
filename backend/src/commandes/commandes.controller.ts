import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandesService } from './commandes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Commandes')
@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post('from-contact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('USER')
  @ApiOperation({ summary: 'Mes commandes (client)' })
  async getMyCommandes(@Request() req) {
    return this.commandesService.getCommandesForUser(req.user.id);
  }

  // Alias pratique: /commandes/me -> même résultat que /commandes/mes-commandes
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('USER')
  @ApiOperation({ summary: 'Alias: mes commandes (client)' })
  async getMyCommandesAlias(@Request() req) {
    return this.commandesService.getCommandesForUser(req.user.id);
  }

  @Get('mes-commandes-prestataire')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('PRESTATAIRE')
  @ApiOperation({ summary: 'Mes commandes (prestataire)' })
  async getMyCommandesPrestataire(@Request() req) {
    return this.commandesService.getCommandesForPrestataire(req.user.id);
  }

  @Patch(':id/terminer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('USER')
  @ApiOperation({ summary: 'Marquer une commande comme terminée (client)' })
  async terminerCommande(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.commandesService.terminerCommande(id, req.user.id);
  }

  @Patch(':id/annuler')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('USER')
  @ApiOperation({ summary: 'Annuler une commande (client)' })
  async annulerCommande(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.commandesService.annulerCommande(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('PRESTATAIRE')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { statut: string },
    @Request() req,
  ) {
    return this.commandesService.updateStatus(id, body.statut, req.user.id);
  }

  @Get('prestataire/:prestataireId/recentes')
  @ApiOperation({ summary: 'Récupérer les dernières commandes terminées d\'un prestataire (public)' })
  async getCommandesRecentPourPrestataire(@Param('prestataireId') prestataireId: string) {
    return this.commandesService.getCommandesRecentPourPrestataire(prestataireId);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Lister toutes les commandes clients' })
  async getAllCommandesAdmin() {
    return this.commandesService.getAllForAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une commande' })
  async findOne(@Param('id') id: string) {
    return this.commandesService.findOne(id);
  }
}
