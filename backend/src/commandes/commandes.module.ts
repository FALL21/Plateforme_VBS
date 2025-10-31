import { Module } from '@nestjs/common';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommandesController],
  providers: [CommandesService],
  exports: [CommandesService],
})
export class CommandesModule {}

