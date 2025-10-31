import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecteursService } from './secteurs.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';
import { CreateSousSecteurDto } from './dto/create-sous-secteur.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Secteurs')
@Controller('secteurs')
export class SecteursController {
  constructor(private readonly secteursService: SecteursService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les secteurs actifs' })
  @ApiResponse({ status: 200, description: 'Liste des secteurs' })
  async findAll() {
    return this.secteursService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupère un secteur par ID' })
  @ApiResponse({ status: 200, description: 'Secteur trouvé' })
  @ApiResponse({ status: 404, description: 'Secteur non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.secteursService.findOne(id);
  }

  @Get(':id/sous-secteurs')
  @ApiOperation({ summary: 'Liste les sous-secteurs d\'un secteur' })
  @ApiResponse({ status: 200, description: 'Liste des sous-secteurs' })
  async findSousSecteurs(@Param('id') id: string) {
    return this.secteursService.findSousSecteurs(id);
  }

  // ============ ADMIN ENDPOINTS ============

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Créer un nouveau secteur' })
  @ApiResponse({ status: 201, description: 'Secteur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Un secteur avec ce nom existe déjà' })
  async create(@Body() createSecteurDto: CreateSecteurDto) {
    return this.secteursService.create(createSecteurDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Modifier un secteur' })
  @ApiResponse({ status: 200, description: 'Secteur modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Secteur non trouvé' })
  async update(@Param('id') id: string, @Body() updateSecteurDto: UpdateSecteurDto) {
    return this.secteursService.update(id, updateSecteurDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Supprimer (désactiver) un secteur' })
  @ApiResponse({ status: 200, description: 'Secteur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Secteur non trouvé' })
  async remove(@Param('id') id: string) {
    return this.secteursService.remove(id);
  }

  @Post('sous-secteurs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Créer un nouveau sous-secteur' })
  @ApiResponse({ status: 201, description: 'Sous-secteur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createSousSecteur(@Body() createSousSecteurDto: CreateSousSecteurDto) {
    return this.secteursService.createSousSecteur(createSousSecteurDto);
  }

  @Put('sous-secteurs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Modifier un sous-secteur' })
  @ApiResponse({ status: 200, description: 'Sous-secteur modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Sous-secteur non trouvé' })
  async updateSousSecteur(
    @Param('id') id: string,
    @Body() updateData: { nom?: string; description?: string; actif?: boolean },
  ) {
    return this.secteursService.updateSousSecteur(id, updateData);
  }

  @Delete('sous-secteurs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Supprimer (désactiver) un sous-secteur' })
  @ApiResponse({ status: 200, description: 'Sous-secteur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Sous-secteur non trouvé' })
  async removeSousSecteur(@Param('id') id: string) {
    return this.secteursService.removeSousSecteur(id);
  }
}

