import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { SecteursModule } from './secteurs/secteurs.module';
import { ServicesModule } from './services/services.module';
import { AbonnementsModule } from './abonnements/abonnements.module';
import { PaiementsModule } from './paiements/paiements.module';
import { DemandesModule } from './demandes/demandes.module';
import { CommandesModule } from './commandes/commandes.module';
import { AvisModule } from './avis/avis.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PrestatairesModule,
    SecteursModule,
    ServicesModule,
    AbonnementsModule,
    PaiementsModule,
    DemandesModule,
    CommandesModule,
    AvisModule,
    AdminModule,
    FilesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

