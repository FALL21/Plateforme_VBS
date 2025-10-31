import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AbonnementsService } from '../abonnements.service';

@Injectable()
export class AbonnementJobsService {
  constructor(private abonnementsService: AbonnementsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpirationCheck() {
    console.log('Vérification des abonnements expirés...');
    const count = await this.abonnementsService.checkExpirations();
    console.log(`${count} abonnement(s) expiré(s) et désactivé(s)`);
  }
}

