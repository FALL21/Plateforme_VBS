import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrestatairesService } from './prestataires.service';
import { CreatePrestataireDto } from './dto/create-prestataire.dto';
import { SearchPrestatairesDto } from './dto/search-prestataires.dto';
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
}

