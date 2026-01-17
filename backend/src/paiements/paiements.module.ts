import { Module } from '@nestjs/common';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AbonnementsModule } from '../abonnements/abonnements.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, AbonnementsModule, SmsModule],
  controllers: [PaiementsController, WebhooksController],
  providers: [PaiementsService],
  exports: [PaiementsService],
})
export class PaiementsModule {}

