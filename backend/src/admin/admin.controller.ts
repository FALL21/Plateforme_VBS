import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  async getStats() {
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
  @ApiOperation({ summary: 'Paiements en espèces en attente de validation' })
  async getPaiementsPending() {
    return this.adminService.getPaiementsEspecesEnAttente();
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
}
