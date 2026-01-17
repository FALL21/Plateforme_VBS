import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de la plateforme (Admin)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'], description: 'Période pour les statistiques (daily, weekly, monthly). Si non spécifié, retourne les stats globales.' })
  async getStats(@Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    if (period && ['daily', 'weekly', 'monthly'].includes(period)) {
      return this.adminService.getStatsByPeriod(period);
    }
    return this.adminService.getGlobalStats();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Activités administratives récentes' })
  async getActivities() {
    return this.adminService.getRecentActivities();
  }

  @Get('users')
  @ApiOperation({ summary: 'Liste de tous les utilisateurs' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('prestataires/pending-kyc')
  @ApiOperation({ summary: 'Prestataires en attente de validation KYC' })
  async getPrestatairesPendingKyc() {
    return this.adminService.getPrestatairesPendingKyc();
  }

  @Post('prestataires/:id/validate-kyc')
  @ApiOperation({ summary: 'Valider le KYC d\'un prestataire' })
  async validateKyc(
    @Param('id') id: string,
    @Body() body: { statut: 'VALIDE' | 'REFUSE'; motif?: string },
    @Request() req: any,
  ) {
    return this.adminService.validateKyc(id, body.statut, req.user.id, body.motif);
  }

  @Get('paiements/pending')
  @ApiOperation({ summary: 'Paiements en attente de validation (Wave et espèces)' })
  async getPaiementsPending() {
    return this.adminService.getPaiementsEnAttente();
  }

  @Get('abonnements/pending')
  @ApiOperation({ summary: 'Abonnements en attente d\'activation' })
  async getAbonnementsPending() {
    return this.adminService.getAbonnementsEnAttente();
  }

  @Post('paiements/:id/validate')
  @ApiOperation({ summary: 'Valider un paiement en espèces' })
  async validatePaiement(
    @Param('id') id: string,
    @Body() body: { statut: 'VALIDE' | 'REFUSE'; motif?: string },
    @Request() req: any,
  ) {
    return this.adminService.validatePaiement(id, body.statut, req.user.id, body.motif);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Données pour les graphiques et visualisations' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'], description: 'Période pour les graphiques (daily, weekly, monthly). Si non spécifié, retourne les données par défaut (30 jours).' })
  async getChartData(@Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.adminService.getChartData(period);
  }

  @Post('abonnements/cleanup')
  @ApiOperation({ summary: '[ADMIN] Supprimer les abonnements sans paiement associé' })
  async supprimerAbonnementsSansPaiement() {
    return this.adminService.supprimerAbonnementsSansPaiement();
  }

  @Post('commandes/cleanup')
  @ApiOperation({ summary: '[ADMIN] Supprimer les commandes anciennes (hors mois en cours)' })
  async supprimerCommandesAnciennes() {
    return this.adminService.supprimerCommandesAnciennes();
  }
}
