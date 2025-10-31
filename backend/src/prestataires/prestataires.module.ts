import { Module } from '@nestjs/common';
import { PrestatairesController } from './prestataires.controller';
import { PrestatairesService } from './prestataires.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrestatairesController],
  providers: [PrestatairesService],
  exports: [PrestatairesService],
})
export class PrestatairesModule {}

