import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DemandesService } from './demandes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Demandes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('demandes')
export class DemandesController {
  constructor(private readonly demandesService: DemandesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une demande' })
  async create(@Request() req, @Body() body: any) {
    return this.demandesService.create({
      ...body,
      utilisateurId: req.user.id,
    });
  }

  @Get('mes-demandes')
  @Roles('USER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mes demandes (client)' })
  async getMyDemandes(@Request() req) {
    return this.demandesService.findAll(req.user.id);
  }

  @Get('recues')
  @Roles('PRESTATAIRE')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Demandes reçues (prestataire)' })
  async getReceivedDemandes(@Request() req) {
    return this.demandesService.getDemandesForPrestataire(req.user.id);
  }

  @Get('admin')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '[ADMIN] Lister toutes les demandes clients' })
  async getAllDemandesAdmin() {
    return this.demandesService.findAllAdmin();
  }

  @Patch(':id/accept')
  @Roles('PRESTATAIRE')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Accepter une demande' })
  async acceptDemande(@Param('id') id: string, @Request() req) {
    return this.demandesService.acceptDemande(id, req.user.id);
  }

  @Patch(':id/refuse')
  @Roles('PRESTATAIRE')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Refuser une demande' })
  async refuseDemande(@Param('id') id: string, @Request() req) {
    return this.demandesService.refuseDemande(id, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une demande' })
  async findOne(@Param('id') id: string) {
    return this.demandesService.findOne(id);
  }
}
