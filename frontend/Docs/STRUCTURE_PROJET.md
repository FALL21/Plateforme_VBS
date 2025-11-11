# Structure du Projet VBS - Architecture Complète

> **Dernière mise à jour** : 31 Octobre 2025  
> **Statut** : 90% MVP complété, PWA en cours d'implémentation

---

## 📁 Structure Actuelle (Complète)

```
Plateforme_VBS/
├── backend/                                    # API NestJS ✅ 95% 
│   ├── dist/                                   # Build compilé
│   ├── node_modules/
│   ├── prisma/
│   │   ├── schema.prisma                       # ✅ 13 models
│   │   ├── seed.ts                             # ✅ Data test
│   │   └── seed-extended.ts                    # ✅ Data étendue
│   ├── src/
│   │   ├── abonnements/                        # ✅ Module abonnements
│   │   │   ├── abonnements.controller.ts
│   │   │   ├── abonnements.service.ts
│   │   │   ├── abonnements.module.ts
│   │   │   ├── dto/
│   │   │   └── jobs/                           # Cron expiration
│   │   ├── admin/                              # ✅ Module admin
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.module.ts
│   │   ├── auth/                               # ✅ Module authentification
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── otp-request.dto.ts
│   │   │   │   └── otp-verify.dto.ts
│   │   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── avis/                               # ✅ Module avis/notations
│   │   │   ├── avis.controller.ts
│   │   │   ├── avis.service.ts
│   │   │   ├── avis.module.ts
│   │   │   └── dto/
│   │   ├── commandes/                          # ✅ Module commandes
│   │   │   ├── commandes.controller.ts
│   │   │   ├── commandes.service.ts
│   │   │   └── commandes.module.ts
│   │   ├── common/                             # ✅ Utilitaires partagés
│   │   │   ├── decorators/
│   │   │   ├── dto/
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   ├── demandes/                           # ✅ Module demandes
│   │   │   ├── demandes.controller.ts
│   │   │   ├── demandes.service.ts
│   │   │   └── demandes.module.ts
│   │   ├── paiements/                          # ✅ Module paiements
│   │   │   ├── paiements.controller.ts
│   │   │   ├── paiements.service.ts
│   │   │   ├── paiements.module.ts
│   │   │   ├── dto/
│   │   │   └── webhooks/
│   │   ├── prestataires/                       # ✅ Module prestataires
│   │   │   ├── prestataires.controller.ts
│   │   │   ├── prestataires.service.ts
│   │   │   ├── prestataires.module.ts
│   │   │   └── dto/
│   │   ├── prisma/                             # ✅ Service Prisma
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── secteurs/                           # ✅ Module secteurs
│   │   │   ├── secteurs.controller.ts
│   │   │   ├── secteurs.service.ts
│   │   │   ├── secteurs.module.ts
│   │   │   └── dto/
│   │   ├── services/                           # ✅ Module services
│   │   │   ├── services.controller.ts
│   │   │   ├── services.service.ts
│   │   │   └── services.module.ts
│   │   ├── users/                              # ✅ Module users
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/
│   │   ├── app.module.ts                       # ✅ Module principal
│   │   └── main.ts                             # ✅ Point d'entrée
│   ├── .env                                    # Variables environnement
│   ├── .env.example                            # Template .env
│   ├── Dockerfile                              # ✅ Image Docker
│   ├── nest-cli.json                           # Config NestJS
│   ├── package.json                            # Dépendances
│   └── tsconfig.json                           # Config TypeScript
│
├── frontend/                                   # PWA Next.js ✅ 80%
│   ├── app/                                    # App Router Next.js 14+
│   │   ├── (auth)/                             # Routes authentification
│   │   │   └── login/
│   │   │       └── page.tsx                    # ✅ Page login OTP
│   │   ├── (private)/                          # Routes protégées
│   │   │   ├── abonnements/
│   │   │   │   ├── historique/
│   │   │   │   │   └── page.tsx                # ✅ Historique paiements
│   │   │   │   ├── plans/
│   │   │   │   │   └── page.tsx                # ✅ Plans abonnements
│   │   │   │   └── souscrire/
│   │   │   │       └── page.tsx                # ✅ Souscription
│   │   │   ├── admin/                          # Routes admin
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx                # ✅ Dashboard admin
│   │   │   │   ├── moderation/
│   │   │   │   │   └── page.tsx                # ⚠️ Placeholder
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx                # ⚠️ Placeholder
│   │   │   │   ├── secteurs/
│   │   │   │   │   ├── page.tsx                # ✅ Liste secteurs
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx            # ✅ Détail secteur
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx                # ✅ Liste users
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx            # ✅ Détail user
│   │   │   │   └── validations/
│   │   │   │       ├── paiements/
│   │   │   │       │   └── page.tsx            # ✅ Validation paiements
│   │   │   │       └── prestataires/
│   │   │   │           └── page.tsx            # ⚠️ Placeholder KYC
│   │   │   ├── avis/
│   │   │   │   └── page.tsx                    # ✅ Gestion avis
│   │   │   ├── client/
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx                # ✅ Dashboard client
│   │   │   ├── commandes/
│   │   │   │   └── page.tsx                    # ✅ Liste commandes
│   │   │   ├── demandes/
│   │   │   │   ├── page.tsx                    # ✅ Liste demandes
│   │   │   │   └── nouvelle/
│   │   │   │       └── page.tsx                # ✅ Nouvelle demande
│   │   │   ├── prestataire/
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx                # ✅ Création profil
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx                # ✅ Dashboard prestataire
│   │   │   │   ├── demandes/
│   │   │   │   │   └── page.tsx                # ✅ Demandes reçues
│   │   │   │   └── services/
│   │   │   │       └── page.tsx                # ✅ Gestion services
│   │   │   └── profile/
│   │   │       └── page.tsx                    # ✅ Profil utilisateur
│   │   ├── (public)/                           # Routes publiques
│   │   │   ├── prestataires/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx                # ✅ Fiche prestataire
│   │   │   └── recherche/
│   │   │       └── page.tsx                    # ✅ Recherche avancée
│   │   ├── globals.css                         # ✅ Styles globaux
│   │   ├── layout.tsx                          # ✅ Layout principal
│   │   └── page.tsx                            # ✅ Page d'accueil
│   ├── components/                             # Composants React
│   │   ├── ui/                                 # ✅ shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── select.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx                      # ✅ Header avec navigation
│   │   ├── AvisModal.tsx                       # ✅ Modal avis
│   │   ├── ContactPrestataireButton.tsx        # ✅ Bouton contact
│   │   ├── MapView.tsx                         # ✅ Carte Leaflet
│   │   └── RatingStars.tsx                     # ✅ Notation étoiles
│   ├── hooks/                                  # Custom hooks
│   ├── lib/                                    # Utilitaires
│   │   ├── api.ts                              # ✅ Client Axios
│   │   └── utils.ts                            # ✅ Utilitaires
│   ├── public/                                 # Assets statiques
│   │   └── signe.png                           # Logo
│   ├── stores/                                 # State management
│   │   └── auth-store.ts                       # ✅ Store Zustand auth
│   ├── .env.example                            # Template variables
│   ├── .env.local                              # Variables locales
│   ├── components.json                         # ✅ Config shadcn/ui
│   ├── Dockerfile                              # ✅ Image Docker
│   ├── next.config.js                          # ✅ Config Next.js
│   ├── package.json                            # Dépendances
│   ├── postcss.config.js                       # Config PostCSS
│   ├── tailwind.config.ts                      # ✅ Config Tailwind
│   └── tsconfig.json                           # Config TypeScript
│
├── docker-compose.yml                          # ✅ Orchestration Docker
├── .gitignore                                  # ✅ Exclusions Git
│
└── Documentation/                              # ✅ 100%
    ├── IMPLEMENTATIONS_A_FAIRE.md              # 318 tâches PWA
    ├── PROGRES.md                              # État actuel
    ├── ETAPES_SUIVANTES.md                     # Roadmap
    ├── STRUCTURE_PROJET.md                     # Ce fichier
    ├── INSTRUCTIONS_DEMARRAGE.md               # Setup guide
    ├── SYSTEME_AVIS.md                         # Doc avis
    ├── ADMIN_STATUS.md                         # Status admin
    └── README.md                               # Vue d'ensemble
```

---

## 🗄️ Schéma de Base de Données (Prisma)

### Models Principaux (13 total)

```prisma
model User {
  id                  String       @id @default(uuid())
  email               String?      @unique
  phone               String?      @unique
  role                Role         @default(USER)
  actif               Boolean      @default(true)  // ✅ Nouveau
  address             String?
  latitude            Float?
  longitude           Float?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  prestataire         Prestataire?
  demandes            Demande[]
  avis                Avis[]
  commandesClient     Commande[]   @relation("CommandeClient")
  adminActions        AdminAction[]
}

model Prestataire {
  id                  String       @id @default(uuid())
  userId              String       @unique
  raisonSociale       String
  description         String?
  logo                String?
  phone               String
  email               String?
  kycStatut           KycStatut    @default(EN_ATTENTE)
  kycDocuments        String[]
  disponibilite       Boolean      @default(true)
  noteMoyenne         Float        @default(0)
  nombreAvis          Int          @default(0)
  abonnementActif     Boolean      @default(false)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  user                User         @relation(...)
  prestataireServices PrestataireService[]
  demandes            Demande[]
  commandes           Commande[]
  avis                Avis[]
  abonnements         Abonnement[]
  paiements           Paiement[]
}

model Secteur {
  id                  String       @id @default(uuid())
  nom                 String       @unique
  slug                String       @unique
  description         String?
  actif               Boolean      @default(true)
  createdAt           DateTime     @default(now())

  // Relations
  sousSecteurs        SousSecteur[]
}

model SousSecteur {
  id                  String       @id @default(uuid())
  secteurId           String
  nom                 String
  slug                String       @unique
  description         String?
  actif               Boolean      @default(true)
  createdAt           DateTime     @default(now())

  // Relations
  secteur             Secteur      @relation(...)
  services            Service[]
}

model Service {
  id                  String       @id @default(uuid())
  sousSecteurId       String
  nom                 String
  slug                String       @unique
  description         String?
  tarifIndicatif      Float?
  unite               String?
  actif               Boolean      @default(true)
  createdAt           DateTime     @default(now())

  // Relations
  sousSecteur         SousSecteur  @relation(...)
  prestataireServices PrestataireService[]
  demandes            Demande[]
}

model PrestataireService {
  id                  String       @id @default(uuid())
  prestataireId       String
  serviceId           String
  tarif               Float?
  delaiMoyen          String?
  description         String?
  actif               Boolean      @default(true)
  createdAt           DateTime     @default(now())

  // Relations
  prestataire         Prestataire  @relation(...)
  service             Service      @relation(...)

  @@unique([prestataireId, serviceId])
}

model Demande {
  id                  String       @id @default(uuid())
  utilisateurId       String
  prestataireId       String?
  serviceId           String
  description         String
  budget              Float?
  urgence             Urgence      @default(NORMALE)
  statut              StatutDemande @default(EN_ATTENTE)
  latitude            Float?
  longitude           Float?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  utilisateur         User         @relation(...)
  prestataire         Prestataire? @relation(...)
  service             Service      @relation(...)
  commande            Commande?
}

model Commande {
  id                  String       @id @default(uuid())
  demandeId           String?      @unique
  prestataireId       String
  clientId            String
  montant             Float?
  statut              StatutCommande @default(EN_COURS)
  dateDebut           DateTime?
  dateFin             DateTime?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  demande             Demande?     @relation(...)
  prestataire         Prestataire  @relation(...)
  client              User         @relation("CommandeClient", ...)
  avis                Avis?
}

model Avis {
  id                  String       @id @default(uuid())
  commandeId          String       @unique
  prestataireId       String
  utilisateurId       String
  note                Int          // 1-5
  commentaire         String?
  reponse             String?
  statut              StatutAvis   @default(PUBLIE)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  commande            Commande     @relation(...)
  prestataire         Prestataire  @relation(...)
  utilisateur         User         @relation(...)
}

model Abonnement {
  id                  String       @id @default(uuid())
  prestataireId       String
  plan                PlanAbonnement
  dateDebut           DateTime
  dateFin             DateTime
  prix                Float
  statut              StatutAbonnement @default(ACTIF)
  createdAt           DateTime     @default(now())

  // Relations
  prestataire         Prestataire  @relation(...)
  paiement            Paiement?
}

model Paiement {
  id                  String       @id @default(uuid())
  abonnementId        String       @unique
  prestataireId       String
  montant             Float
  methodePaiement     MethodePaiement
  refTransaction      String?
  justificatif        String?
  statutPaiement      StatutPaiement @default(EN_ATTENTE)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  abonnement          Abonnement   @relation(...)
  prestataire         Prestataire  @relation(...)
}

model AdminAction {
  id                  String       @id @default(uuid())
  adminId             String
  type                String       // 'KYC_VALIDATION', 'PAYMENT_VALIDATION', etc.
  cibleId             String       // ID de l'entité cible
  details             Json?
  createdAt           DateTime     @default(now())

  // Relations
  admin               User         @relation(...)
}
```

### Enums

```prisma
enum Role {
  USER          // Client simple
  PRESTATAIRE   // Prestataire de services
  ADMIN         // Administrateur
}

enum KycStatut {
  EN_ATTENTE
  VALIDE
  REFUSE
}

enum StatutDemande {
  EN_ATTENTE
  ACCEPTEE
  REFUSEE
  ANNULEE
}

enum StatutCommande {
  EN_COURS
  TERMINEE
  ANNULEE
}

enum StatutAvis {
  EN_ATTENTE
  PUBLIE
  MASQUE
}

enum PlanAbonnement {
  MENSUEL
  ANNUEL
}

enum StatutAbonnement {
  ACTIF
  EXPIRE
  ANNULE
}

enum MethodePaiement {
  WAVE
  ORANGE_MONEY
  ESPECES
}

enum StatutPaiement {
  EN_ATTENTE
  VALIDE
  REFUSE
}

enum Urgence {
  NORMALE
  URGENTE
}
```

---

## 🔌 API Endpoints (Backend)

### Authentification (`/api/auth`)

- `POST /otp/request` - Demander un code OTP
- `POST /otp/verify` - Vérifier le code OTP et obtenir JWT
- `POST /logout` - Déconnexion

### Secteurs (`/api/secteurs`)

- `GET /` - Liste des secteurs
- `GET /:id` - Détails d'un secteur
- `GET /:id/sous-secteurs` - Sous-secteurs d'un secteur
- **Admin:**
  - `POST /` - Créer un secteur
  - `PUT /:id` - Modifier un secteur
  - `DELETE /:id` - Supprimer un secteur

### Services (`/api/services`)

- `GET /` - Liste des services
- `GET /:id` - Détails d'un service

### Prestataires (`/api/prestataires`)

- `GET /search` - Recherche avec filtres géolocalisés
- `GET /:id` - Fiche détaillée
- **Authentifié Prestataire:**
  - `GET /me` - Mon profil prestataire
  - `POST /` - Créer profil
  - `PATCH /me` - Modifier profil
  - `PATCH /me/disponibilite` - Changer disponibilité

### Users (`/api/users`)

- **Authentifié:**
  - `GET /me` - Mon profil
  - `PATCH /me` - Modifier profil
- **Admin:**
  - `GET /` - Liste utilisateurs
  - `GET /stats` - Statistiques
  - `GET /:id` - Détails utilisateur
  - `PATCH /:id/role` - Changer rôle
  - `PATCH /:id/toggle-status` - Activer/désactiver
  - `DELETE /:id` - Supprimer

### Demandes (`/api/demandes`)

- **Client:**
  - `POST /` - Créer une demande
  - `GET /mes-demandes` - Mes demandes
- **Prestataire:**
  - `GET /recues` - Demandes reçues
  - `PATCH /:id/accepter` - Accepter
  - `PATCH /:id/refuser` - Refuser

### Commandes (`/api/commandes`)

- **Client:**
  - `GET /mes-commandes` - Mes commandes
  - `POST /auto-create` - Créer commande auto (review)
  - `POST /from-contact` - Créer commande depuis contact
  - `PATCH /:id/terminer` - Marquer comme terminée
- **Prestataire:**
  - `GET /mes-commandes` - Mes commandes
  - `PATCH /:id/statut` - Changer statut

### Avis (`/api/avis`)

- `GET /prestataire/:id` - Avis d'un prestataire
- `GET /commande/:id` - Avis d'une commande
- **Client:**
  - `POST /` - Laisser un avis

### Abonnements (`/api/abonnements`)

- `GET /plans` - Liste des plans
- **Prestataire:**
  - `POST /souscrire` - Souscrire
  - `GET /mon-abonnement` - Mon abonnement actif

### Paiements (`/api/paiements`)

- **Prestataire:**
  - `POST /` - Créer un paiement
  - `GET /historique` - Historique
- **Webhooks:**
  - `POST /webhooks/wave` - Webhook Wave
  - `POST /webhooks/orange-money` - Webhook Orange Money

### Admin (`/api/admin`)

- `GET /stats` - Statistiques globales
- `GET /activities` - Activités récentes
- `GET /kyc/pending` - KYC en attente
- `PATCH /kyc/:id/valider` - Valider KYC
- `PATCH /kyc/:id/refuser` - Refuser KYC
- `GET /paiements/pending` - Paiements en attente
- `PATCH /paiements/:id/valider` - Valider paiement

---

## 🎯 Statut des Modules

| Module           | Backend | Frontend | Statut                   |
| ---------------- | ------- | -------- | ------------------------ |
| Authentification | ✅ 100% | ✅ 100%  | Complet                  |
| Secteurs         | ✅ 100% | ✅ 100%  | Complet                  |
| Services         | ✅ 100% | ✅ 100%  | Complet                  |
| Prestataires     | ✅ 100% | ✅ 100%  | Complet                  |
| Users            | ✅ 100% | ✅ 100%  | Complet                  |
| Demandes         | ✅ 100% | ✅ 100%  | Complet                  |
| Commandes        | ✅ 100% | ✅ 100%  | Complet                  |
| Avis             | ✅ 100% | ✅ 100%  | Complet                  |
| Abonnements      | ✅ 100% | ✅ 100%  | Complet                  |
| Paiements        | ✅ 90%  | ✅ 90%   | Sandbox OK, Prod à faire |
| Admin            | ✅ 100% | ✅ 80%   | KYC à compléter          |
| **PWA Features** | ⚠️ 0%   | ⚠️ 10%   | **À implémenter**        |

---

## 📦 À Créer pour PWA Complète

### Frontend (Priorité)

```
frontend/
├── public/
│   ├── manifest.json                           # ⚠️ À créer
│   ├── robots.txt                              # ⚠️ À créer
│   ├── sitemap.xml                             # ⚠️ À créer
│   ├── icons/                                  # ⚠️ À créer (8 tailles)
│   ├── screenshots/                            # ⚠️ À créer
│   └── firebase-messaging-sw.js                # ⚠️ À créer
├── lib/
│   ├── db.ts                                   # ⚠️ IndexedDB/Dexie
│   ├── firebase.ts                             # ⚠️ Firebase config
│   ├── background-sync.ts                      # ⚠️ Background Sync
│   ├── geolocation.ts                          # ⚠️ Service géoloc
│   ├── share.ts                                # ⚠️ Web Share API
│   ├── gtag.ts                                 # ⚠️ Google Analytics
│   └── web-vitals.ts                           # ⚠️ Web Vitals
├── components/
│   ├── InstallPrompt.tsx                       # ⚠️ À créer
│   ├── OfflineIndicator.tsx                    # ⚠️ À créer
│   ├── LoadingSpinner.tsx                      # ⚠️ À créer
│   ├── BottomNav.tsx                           # ⚠️ À créer
│   ├── ImageOptimized.tsx                      # ⚠️ À créer
│   └── ... (14 composants métier)              # ⚠️ Voir liste IMPLEMENTATIONS
└── hooks/
    ├── useOfflineSync.ts                       # ⚠️ À créer
    ├── useGeolocation.ts                       # ⚠️ À créer
    └── usePrestataires.ts (React Query)        # ⚠️ À créer
```

### Backend (Priorité Moyenne)

```
backend/src/
├── notifications/                              # ⚠️ Module à créer
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── notifications.module.ts
└── upload/                                     # ⚠️ Module à créer
    ├── upload.controller.ts
    ├── upload.service.ts
    └── upload.module.ts
```

---

## 🔗 Dépendances Principales

### Backend

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@prisma/client": "^5.7.1",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "passport-jwt": "^4.0.1"
}
```

### Frontend

```json
{
  "next": "^14.1.0",
  "react": "^18.2.0",
  "typescript": "^5.3.3",
  "tailwindcss": "^3.4.1",
  "zustand": "^4.5.0",
  "axios": "^1.6.5",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@radix-ui/react-select": "^2.0.0"
}
```

### À Installer (PWA)

```bash
# Frontend
npm install next-pwa
npm install firebase
npm install dexie dexie-react-hooks
npm install @tanstack/react-query
npm install web-vitals
npm install react-use-gesture @react-spring/web

# Backend
npm install firebase-admin
npm install @aws-sdk/client-s3 sharp multer
```

---

## 📚 Références Documentation

- 📖 [IMPLEMENTATIONS_A_FAIRE.md](./IMPLEMENTATIONS_A_FAIRE.md) - 318 tâches PWA détaillées
- 📖 [PROGRES.md](./PROGRES.md) - État actuel 90% MVP
- 📖 [ETAPES_SUIVANTES.md](./ETAPES_SUIVANTES.md) - Roadmap 14 semaines
- 📖 [README.md](./README.md) - Vue d'ensemble projet

---

**🏗️ Structure complète et documentée | Prête pour transformation PWA ! 🚀**
