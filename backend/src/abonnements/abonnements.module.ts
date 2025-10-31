import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AbonnementsController } from './abonnements.controller';
import { AbonnementsService } from './abonnements.service';
import { AbonnementJobsService } from './jobs/abonnement-jobs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [AbonnementsController],
  providers: [AbonnementsService, AbonnementJobsService],
  exports: [AbonnementsService],
})
export class AbonnementsModule {}

