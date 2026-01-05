import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AbonnementsService } from './abonnements.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Abonnements')
@Controller('abonnements')
export class AbonnementsController {
  constructor(private readonly abonnementsService: AbonnementsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Liste les plans d\'abonnement disponibles' })
  async getPlans() {
    return this.abonnementsService.getPlans();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un abonnement' })
  async create(@Request() req, @Body() dto: CreateAbonnementDto) {
    return this.abonnementsService.create(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer mon abonnement actuel' })
  async getMyAbonnement(@Request() req) {
    return this.abonnementsService.findMyAbonnement(req.user.id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Activer un abonnement' })
  async activateAbonnement(@Param('id') id: string) {
    return this.abonnementsService.activateAbonnement(id);
  }
}

