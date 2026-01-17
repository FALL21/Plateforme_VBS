import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrestatairesService } from './prestataires.service';
import { CreatePrestataireDto } from './dto/create-prestataire.dto';
import { UpdatePrestataireDto } from './dto/update-prestataire.dto';
import { SearchPrestatairesDto } from './dto/search-prestataires.dto';
import { CreatePrestataireWorkDto } from './dto/create-prestataire-work.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Prestataires')
@Controller('prestataires')
export class PrestatairesController {
  constructor(private readonly prestatairesService: PrestatairesService) {}

  @Get()
  @ApiOperation({ summary: 'Rechercher des prestataires (géolocalisé)' })
  async search(@Query() dto: SearchPrestatairesDto) {
    return this.prestatairesService.search(dto);
  }

  @Get('mon-profil')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer mon profil prestataire' })
  async getMyProfile(@Request() req) {
    return this.prestatairesService.findByUserId(req.user.id);
  }

  // Alias accessible à tout utilisateur authentifié pour vérifier l'existence d'un profil prestataire
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer mon profil prestataire (alias), 404 si inexistant' })
  async getMyProfileAlias(@Request() req) {
    const result = await this.prestatairesService.findMyPrestataire(req.user.id);
    if (!result) {
      // Harmoniser avec le flux frontend qui attend un 404 si aucun profil n'existe
      throw new NotFoundException('Profil prestataire non trouvé');
    }
    return result;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour mon profil prestataire' })
  async updateMyProfile(@Request() req, @Body() dto: UpdatePrestataireDto) {
    return this.prestatairesService.updateByUserId(req.user.id, dto);
  }

  @Post('travaux')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PRESTATAIRE] Ajouter un travail récent (image + texte)' })
  async addTravailRecent(@Request() req, @Body() dto: CreatePrestataireWorkDto) {
    return this.prestatairesService.addTravailRecent(req.user.id, dto);
  }

  @Delete('travaux/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PRESTATAIRE] Supprimer un travail récent' })
  async deleteTravailRecent(@Request() req, @Param('id') id: string) {
    return this.prestatairesService.deleteTravailRecent(req.user.id, id);
  }

  @Patch('travaux/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[PRESTATAIRE] Remplacer un travail récent (image + texte)' })
  async updateTravailRecent(@Request() req, @Param('id') id: string, @Body() dto: CreatePrestataireWorkDto) {
    return this.prestatairesService.updateTravailRecent(req.user.id, id, dto);
  }

  @Patch('disponibilite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier ma disponibilité' })
  async updateDisponibilite(
    @Request() req,
    @Body() body: { disponibilite: boolean },
  ) {
    return this.prestatairesService.updateDisponibilite(req.user.id, body.disponibilite);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un profil prestataire' })
  async create(@Request() req, @Body() dto: CreatePrestataireDto) {
    return this.prestatairesService.create(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un prestataire par ID' })
  async findOne(@Param('id') id: string) {
    return this.prestatairesService.findOne(id);
  }

  @Patch(':id/toggle-abonnement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Activer/Désactiver l\'abonnement d\'un prestataire' })
  async toggleAbonnement(@Param('id') id: string) {
    return this.prestatairesService.toggleAbonnement(id);
  }

  @Patch('me/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les services proposés' })
  async updateServices(@Request() req, @Body() body: { serviceIds: string[] }) {
    return this.prestatairesService.updateServices(req.user.id, body.serviceIds);
  }

  @Get('reports/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques de services prestés par période' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: true })
  async getStats(@Request() req, @Query('period') period: 'daily' | 'weekly' | 'monthly') {
    return this.prestatairesService.getStatsByPeriod(req.user.id, period);
  }

  @Get('reports/charts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRESTATAIRE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les données de graphiques pour les services prestés' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: false })
  async getChartData(@Request() req, @Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.prestatairesService.getChartData(req.user.id, period);
  }
}

