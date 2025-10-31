import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaiementsService } from '../paiements.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Post('wave/confirmation')
  @ApiOperation({ summary: 'Webhook Wave - Confirmation paiement' })
  async waveConfirmation(@Body() body: any, @Headers('x-wave-signature') signature: string) {
    // TODO: Vérifier la signature
    // TODO: Traiter le webhook Wave
    if (body.status === 'success' && body.transactionId) {
      // Trouver le paiement par référence
      // await this.paiementsService.confirmerPaiement(...)
    }
    return { received: true };
  }

  @Post('orange-money/confirmation')
  @ApiOperation({ summary: 'Webhook Orange Money - Confirmation paiement' })
  async orangeMoneyConfirmation(@Body() body: any, @Headers('x-orange-signature') signature: string) {
    // TODO: Vérifier la signature
    // TODO: Traiter le webhook Orange Money
    return { received: true };
  }
}

