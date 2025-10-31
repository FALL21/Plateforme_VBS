import { Module } from '@nestjs/common';
import { DemandesController } from './demandes.controller';
import { DemandesService } from './demandes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DemandesController],
  providers: [DemandesService],
  exports: [DemandesService],
})
export class DemandesModule {}

