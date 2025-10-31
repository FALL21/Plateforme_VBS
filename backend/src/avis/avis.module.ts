import { Module } from '@nestjs/common';
import { AvisController } from './avis.controller';
import { AvisService } from './avis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AvisController],
  providers: [AvisService],
  exports: [AvisService],
})
export class AvisModule {}
