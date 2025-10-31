import { Module } from '@nestjs/common';
import { SecteursController } from './secteurs.controller';
import { SecteursService } from './secteurs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecteursController],
  providers: [SecteursService],
  exports: [SecteursService],
})
export class SecteursModule {}
