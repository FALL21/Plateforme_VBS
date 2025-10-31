# 🏗️ Plateforme VBS - Vos Besoins Services

> **Progressive Web App (PWA)** de mise en relation entre utilisateurs et prestataires de services au Sénégal

[![NestJS](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-teal.svg)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/MVP-90%25-brightgreen.svg)]()

---

## 📊 État du Projet

**Dernière mise à jour** : 31 Octobre 2025

### Progression Globale : 90% 🚀

- ✅ **Backend** : 95% (Production-ready)
- ✅ **Frontend** : 80% (Fonctionnel, PWA à compléter)
- ✅ **Documentation** : 100% (Complète)
- ✅ **Infrastructure** : 95% (Docker configuré)

**Ce qui manque** : 10% pour un MVP PWA complet (Manifest, Service Worker, Notifications Push, Optimisations)

---

## 🏗️ Architecture

```
Plateforme_VBS/
├── backend/          # API NestJS + Prisma + PostgreSQL
│   ├── 11 modules fonctionnels ✅
│   ├── 13 models de données ✅
│   ├── Authentification OTP + JWT ✅
│   ├── RBAC (Admin/Prestataire/Client) ✅
│   └── Swagger documentation ✅
│
├── frontend/         # PWA Next.js 14 + React
│   ├── 20+ pages (Public/Private/Admin) ✅
│   ├── App Router + SSR/CSR ✅
│   ├── Tailwind CSS + shadcn/ui ✅
│   ├── Zustand state management ✅
│   ├── Leaflet maps + geolocation ✅
│   └── PWA features (10% - à compléter) ⚠️
│
└── docker-compose.yml # PostgreSQL + Redis ✅
```

---

## ✨ Fonctionnalités Principales

### Pour les Clients
- ✅ **Recherche géolocalisée** de prestataires avec carte interactive
- ✅ **Consultation** de fiches détaillées (services, tarifs, avis)
- ✅ **Création de demandes** de services
- ✅ **Gestion des commandes** (EN_COURS, TERMINEE)
- ✅ **Système d'avis** avec notation 1-5 étoiles
- ✅ **Contact direct** des prestataires (appel téléphonique)
- ✅ **Dashboard** avec statistiques et historique

### Pour les Prestataires
- ✅ **Création et gestion** de profil professionnel
- ✅ **Gestion des services** proposés avec tarifs
- ✅ **Réception et traitement** des demandes clients
- ✅ **Gestion de disponibilité**
- ✅ **Système d'abonnements** (Mensuel/Annuel)
- ✅ **Paiements** Wave Money, Orange Money, Espèces
- ✅ **Dashboard** avec statistiques et KPIs
- ✅ **Consultation des avis** clients

### Pour les Administrateurs
- ✅ **Dashboard complet** avec KPIs et activités
- ✅ **Gestion des utilisateurs** (CRUD, rôles, activation)
- ✅ **Gestion de la taxonomie** (secteurs, sous-secteurs, services)
- ✅ **Validation KYC** des prestataires
- ✅ **Validation des paiements** espèces
- ✅ **Modération des avis**
- ✅ **Rapports et analytics**

### Fonctionnalités Techniques
- ✅ **Authentification OTP** par email ou téléphone
- ✅ **Normalisation automatique** des numéros sénégalais (+221)
- ✅ **Guards et permissions** par rôle
- ✅ **Gestion des comptes** actifs/désactivés
- ✅ **Filtrage automatique** des prestataires désactivés
- ✅ **Seed data** étendu pour tests
- ✅ **Docker** pour développement et production

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- npm ou yarn

### Installation Complète

```bash
# 1. Cloner le repository
git clone <repo-url>
cd Plateforme_VBS

# 2. Backend - Installation
cd backend
npm install
npx prisma generate

# 3. Frontend - Installation
cd ../frontend
npm install

# 4. Configuration environnement
# Backend
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos valeurs

# Frontend
cp frontend/.env.example frontend/.env.local
# Éditer frontend/.env.local

# 5. Démarrer l'infrastructure Docker
docker-compose up -d postgres redis

# 6. Base de données - Initialisation
cd backend
npx prisma migrate deploy
npx prisma db seed

# 7. Démarrer les services
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Accès

- 🌐 **Frontend** : http://localhost:3000
- 🔌 **Backend API** : http://localhost:4000
- 📚 **Swagger** : http://localhost:4000/api
- 🗄️ **Prisma Studio** : `npx prisma studio` (dans /backend)

### Comptes de Test (après seed)

**Admin:**
- Email: admin@vbs.sn
- Phone: +221770000000
- OTP Code: 123456

**Prestataire:**
- Phone: +221770001000
- OTP Code: 123456

**Client:**
- Phone: +221770009999
- OTP Code: 123456

---

## 🛠️ Technologies

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM TypeScript
- **PostgreSQL** - Base de données
- **Redis** - Cache et sessions
- **Passport JWT** - Authentification
- **Class Validator** - Validation DTOs
- **Swagger** - Documentation API

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Composants UI modernes
- **Zustand** - State management léger
- **Axios** - Client HTTP
- **Leaflet** - Cartes interactives
- **React Hook Form** - Gestion de formulaires
- **Zod** - Validation schemas

### DevOps
- **Docker** - Containerisation
- **Docker Compose** - Orchestration
- **GitHub Actions** - CI/CD (à configurer)

---

## 📝 Scripts Utiles

### Backend

```bash
npm run start:dev      # Développement (watch mode)
npm run build          # Build production
npm run start:prod     # Démarrer en production
npm run test           # Tests unitaires
npm run test:e2e       # Tests E2E

# Prisma
npx prisma studio      # Interface GUI base de données
npx prisma generate    # Générer le client Prisma
npx prisma migrate dev # Créer une migration
npx prisma db seed     # Seed la base de données
```

### Frontend

```bash
npm run dev            # Développement
npm run build          # Build production
npm run start          # Démarrer build production
npm run lint           # ESLint
npm run lint:fix       # ESLint avec corrections auto
```

### Docker

```bash
docker-compose up -d              # Démarrer tous les services
docker-compose up -d postgres     # Démarrer PostgreSQL uniquement
docker-compose up -d redis        # Démarrer Redis uniquement
docker-compose logs -f backend    # Voir les logs backend
docker-compose down               # Arrêter tous les services
docker-compose down -v            # Arrêter et supprimer volumes
```

---

## 📚 Documentation Complète

### Guides de Développement
- 📖 [IMPLEMENTATIONS_A_FAIRE.md](./IMPLEMENTATIONS_A_FAIRE.md) - **318 tâches PWA détaillées** (Expert PWA)
- 📖 [ETAPES_SUIVANTES.md](./ETAPES_SUIVANTES.md) - Roadmap 14 semaines avec sprints
- 📖 [PROGRES.md](./PROGRES.md) - État actuel du projet (90% MVP)
- 📖 [STRUCTURE_PROJET.md](./STRUCTURE_PROJET.md) - Architecture détaillée
- 📖 [INSTRUCTIONS_DEMARRAGE.md](./INSTRUCTIONS_DEMARRAGE.md) - Setup pas-à-pas
- 📖 [SYSTEME_AVIS.md](./SYSTEME_AVIS.md) - Documentation système d'avis

### Cahiers des Charges
- 📋 [Cahier des charges - VBS.md](../Cahier%20des%20charges%20-%20VBS.md)
- 📋 [Plan de développement - VBS.md](../Plan%20de%20développement%20-%20VBS.md)

---

## 🎯 Prochaines Étapes (10% restant)

### Phase 1 : PWA Core (2 semaines) ⚡
**Quick Wins - 15h de développement :**
1. Créer `manifest.json` avec icônes
2. Configurer Service Worker (next-pwa)
3. Ajouter meta tags SEO complets
4. Créer composant `InstallPrompt.tsx`
5. Tester installation sur mobile

### Phase 2 : Notifications Push (1 semaine)
- Firebase Cloud Messaging
- Backend notifications service
- Frontend permission request

### Phase 3 : Optimisations (1 semaine)
- React Query pour cache
- Code splitting
- Image optimization
- Web Vitals monitoring

### Phase 4 : Production (2 semaines)
- Tests E2E (Playwright)
- Lighthouse audits (score 100)
- Intégrations paiement production
- Déploiement

**👉 Voir [IMPLEMENTATIONS_A_FAIRE.md](./IMPLEMENTATIONS_A_FAIRE.md) pour la liste complète des 318 tâches**

---

## 🔐 Variables d'Environnement

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vbs_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# OTP (Production)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Paiements (Production)
WAVE_API_KEY=
WAVE_API_URL=
ORANGE_MONEY_CLIENT_ID=
ORANGE_MONEY_CLIENT_SECRET=

# Upload (Production)
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Firebase (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Analytics (Production)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 🧪 Tests

### Backend (À implémenter)
```bash
npm run test           # Tests unitaires
npm run test:watch     # Watch mode
npm run test:cov       # Coverage
npm run test:e2e       # E2E tests
```

### Frontend (À implémenter)
```bash
npm run test           # Jest + React Testing Library
npm run test:e2e       # Playwright E2E
npm run lighthouse     # Audit Lighthouse
```

**Objectif** : >80% coverage + tests E2E sur parcours critiques

---

## 🚀 Déploiement

### Production Checklist

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL production
- [ ] Redis production
- [ ] SSL/TLS configuré (HTTPS)
- [ ] CDN pour assets statiques
- [ ] CI/CD GitHub Actions
- [ ] Monitoring (Sentry + Google Analytics)
- [ ] Backup automatique base de données
- [ ] Tests E2E passants
- [ ] Lighthouse score PWA = 100

### Hébergement Recommandé

**Backend :**
- Railway / Render / Heroku
- AWS ECS / Google Cloud Run
- VPS avec Docker

**Frontend :**
- Vercel (recommandé pour Next.js)
- Netlify
- AWS Amplify

**Base de Données :**
- Supabase (PostgreSQL)
- Railway PostgreSQL
- AWS RDS

---

## 🤝 Contribution

### Workflow Git

```bash
# Créer une branche feature
git checkout -b feature/nom-feature

# Faire vos modifications
git add .
git commit -m "feat: description"

# Pousser
git push origin feature/nom-feature

# Créer une Pull Request
```

### Convention de Commits

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, lint
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## 📊 Métriques & KPIs

### Performance Targets (Production)
- ⚡ Lighthouse Performance > 90
- 📱 Lighthouse PWA = 100
- ♿ Lighthouse Accessibility > 90
- 🔍 Lighthouse SEO > 90
- ⏱️ First Contentful Paint < 1.8s
- ⏱️ Time to Interactive < 3.8s

### Objectifs Business
- 👥 100+ prestataires actifs (mois 1)
- 🎯 1000+ utilisateurs (mois 3)
- 📝 500+ demandes/mois (mois 6)
- ⭐ Note moyenne > 4.2/5
- 📈 Taux de conversion > 15%

---

## 📞 Support & Contact

### Équipe Projet
- **Product Owner** : [À définir]
- **Lead Developer** : [À définir]
- **DevOps** : [À définir]

### Ressources
- 📧 Email : support@vbs.sn
- 🐛 Issues : GitHub Issues
- 📚 Documentation : Ce repository
- 💬 Chat : Discord/Slack (à créer)

---

## 📄 Licence

Propriétaire - VBS Team © 2025

---

## 🎉 Remerciements

Merci à tous les contributeurs et aux technologies open-source utilisées :
- NestJS Team
- Vercel (Next.js)
- Prisma Team
- shadcn/ui
- Tailwind CSS
- Et tous les mainteneurs des packages npm utilisés

---

**🚀 Plateforme VBS - Connectons les besoins aux services ! 🇸🇳**

---

## 📈 Changelog

### [Unreleased] - En développement
- PWA configuration complète
- Notifications Push (Firebase)
- Optimisations performance
- Tests E2E
- Production deployment

### [0.9.0] - 2025-10-31
- ✅ MVP 90% complété
- ✅ Backend 11 modules fonctionnels
- ✅ Frontend 20+ pages
- ✅ Système d'avis complet
- ✅ Dashboard admin opérationnel
- ✅ Gestion utilisateurs (activation/désactivation)
- ✅ Normalisation téléphones automatique
- ✅ Documentation complète (318 tâches PWA)

### [0.5.0] - 2025-10-15
- ✅ Backend modules de base
- ✅ Frontend structure Next.js
- ✅ Authentification OTP
- ✅ Recherche géolocalisée
- ✅ Docker setup

---

**Dernière mise à jour** : 31 Octobre 2025 🎃
