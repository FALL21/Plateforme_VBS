import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaiementsService } from './paiements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DeclarerEspecesDto } from './dto/declarer-especes.dto';

@ApiTags('Paiements')
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Post('wave/initier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiier un paiement Wave' })
  async initierWave(@Body() body: { abonnementId: string; montant: number }) {
    return this.paiementsService.initierWave(body.abonnementId, body.montant);
  }

  @Post('especes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déclarer un paiement en espèces' })
  async declarerEspeces(@Body() dto: DeclarerEspecesDto) {
    return this.paiementsService.declarerEspeces(dto.abonnementId, dto.montant, dto.justificatifUrl);
  }

  @Get('me/historique')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique de mes paiements' })
  async getHistorique(@Request() req) {
    return this.paiementsService.getHistoriquePaiements(req.user.id);
  }
}

