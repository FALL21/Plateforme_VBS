## Plan de développement — VOS BESOINS SERVICES (VBS)

### Vue d'ensemble

**Durée totale estimée** : 10 semaines (MVP)  
**Équipe recommandée** : 4-6 personnes

- 1-2 Développeurs Frontend (Next.js/React)
- 1-2 Développeurs Backend (NestJS)
- 1 DevOps/Architecte
- 1 Designer UX/UI (mi-temps)
- 1 Product Owner/Chef de projet

---

## Architecture du plan

### Phases principales

```
PHASE 0: Préparation & Cadrage (2 semaines)
    ↓
PHASE 1: Fondations & Infrastructure (2 semaines)
    ↓
PHASE 2: Core Features - Recherche & Catalogue (2 semaines)
    ↓
PHASE 3: Authentification & Profils (1 semaine)
    ↓
PHASE 4: Abonnements & Paiements (2 semaines)
    ↓
PHASE 5: Commandes & Avis (1 semaine)
    ↓
PHASE 6: Admin & Finalisation (1 semaine)
    ↓
PHASE 7: Tests & Déploiement (1 semaine)
```

---

## Organigramme détaillé par phase

### PHASE 0: Préparation & Cadrage (Semaines 1-2)

**Objectif** : Mise en place des bases, design système, architecture technique.

#### 0.1. Configuration initiale des repos (Semaine 1, Jours 1-2)

- [ ] Création repos GitHub (frontend, backend, docs)
- [ ] Configuration ESLint, Prettier, TypeScript strict
- [ ] Setup pré-commit hooks (Husky)
- [ ] Configuration base CI/CD (GitHub Actions)

**Assignation** : DevOps/Lead Dev  
**Livrable** : Repos configurés, pipelines CI/CD basiques

#### 0.2. Design système & UI/UX (Semaine 1-2)

- [ ] Audit concurrentiel
- [ ] Design système (tokens, couleurs, typographie)
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Composants UI de base (Button, Card, Input, Modal, etc.)
- [ ] Wireframes principaux (Home, Recherche, Fiche prestataire, Profil)
- [ ] Prototypes Figma/design tool

**Assignation** : Designer UX/UI + Frontend Lead  
**Livrable** : Design system complet, composants UI réutilisables

#### 0.3. Architecture technique & schéma DB (Semaine 1-2)

- [ ] Architecture détaillée (diagrammes)
- [ ] Schéma Prisma complet (all models, relations, indexes)
- [ ] Configuration PostgreSQL + PostGIS (local + staging)
- [ ] Setup NestJS projet de base (structure MVC)
- [ ] Configuration Prisma + première migration
- [ ] Documentation architecture (ADR - Architecture Decision Records)

**Assignation** : Backend Lead + Architecte  
**Livrable** : Architecture validée, schéma DB versionné, projet NestJS initialisé

#### 0.4. Intégrations externes - Sandbox (Semaine 2)

- [ ] Inscription/accès Wave API (sandbox)
- [ ] Inscription/accès Orange Money API (sandbox)
- [ ] Tests d'intégration basiques (webhooks mockés)
- [ ] Documentation intégrations (endpoints, payloads)

**Assignation** : Backend Dev  
**Livrable** : Accès API obtenus, tests sandbox OK

**Jalon Phase 0** : Design système validé, architecture documentée, repos configurés, schéma DB migré.

---

### PHASE 1: Fondations & Infrastructure (Semaines 3-4)

**Objectif** : Infrastructure de base, environnement de développement, outils essentiels.

#### 1.1. Setup Backend - NestJS Base (Semaine 3, Jours 1-3)

- [ ] Configuration NestJS (modules, providers)
- [ ] Setup Prisma Service/Module
- [ ] Configuration Swagger/OpenAPI
- [ ] Middleware globaux (logging, errors, CORS)
- [ ] Configuration @nestjs/throttler
- [ ] Setup @nestjs/helmet (sécurité headers)
- [ ] Configuration variables d'environnement (.env)

**Assignation** : Backend Dev  
**Livrable** : API NestJS fonctionnelle, Swagger accessible

#### 1.2. Setup Frontend - Next.js Base (Semaine 3, Jours 1-3)

- [ ] Initialisation Next.js 14+ (App Router, TypeScript)
- [ ] Configuration Tailwind CSS + shadcn/ui
- [ ] Structure dossiers (app/, components/, lib/, hooks/)
- [ ] Setup API client (Fetch avec interceptors)
- [ ] Configuration Zustand (stores)
- [ ] Layout principal (Header, Footer, Navigation)
- [ ] Pages 404, 500, loading states

**Assignation** : Frontend Dev  
**Livrable** : Application Next.js fonctionnelle, navigation PK

#### 1.3. Docker & Environnements (Semaine 3, Jours 4-5)

- [ ] Dockerfile backend (NestJS, multi-stage)
- [ ] Dockerfile frontend (Next.js)
- [ ] Docker Compose (dev: frontend, backend, PostgreSQL, Redis)
- [ ] Scripts développement (start, build, test)
- [ ] Configuration staging (variables env)

**Assignation** : DevOps  
**Livrable** : Environnement Docker opérationnel, dev/staging configurés

#### 1.4. Base de données & Seed (Semaine 4, Jours 1-2)

- [ ] Création schéma Prisma complet
  - [ ] Models: User, Prestataire, Secteur, Service, etc.
  - [ ] Relations, contraintes, indexes
- [ ] Migrations Prisma initiales
- [ ] Seed data (secteurs, sous-secteurs, services de base)
- [ ] Configuration PostGIS (extensions, requêtes test)

**Assignation** : Backend Dev  
**Livrable** : DB migrée, données de base chargées

#### 1.5. Redis & Cache (Semaine 4, Jours 3)

- [ ] Configuration Redis (local + staging)
- [ ] Module NestJS Redis/cache
- [ ] Stratégies cache (sessions, requêtes fréquentes)
- [ ] Tests cache (hit/miss, invalidation)

**Assignation** : Backend Dev  
**Livrable** : Cache Redis opérationnel

#### 1.6. Observabilité & Logs (Semaine 4, Jours 4-5)

- [ ] Configuration Pino (logs structurés JSON)
- [ ] Logging middleware NestJS
- [ ] Configuration Sentry (backend + frontend)
- [ ] Setup Prometheus (métriques de base)
- [ ] Dashboard Grafana basique

**Assignation** : DevOps + Backend Dev  
**Livrable** : Logs centralisés, monitoring basique

**Jalon Phase 1** : Infrastructure complète, DB migrée, environnements dev/staging opérationnels, monitoring actif.

---

### PHASE 2: Core Features - Recherche & Catalogue (Semaines 5-6)

**Objectif** : Fonctionnalités principales de recherche et affichage des prestataires.

#### 2.1. API Référentiels - Secteurs/Services (Semaine 5, Jours 1-2)

- [ ] Controller Secteurs (GET /secteurs, /secteurs/{id}/sous-secteurs)
- [ ] Controller Services (GET /services, filtres)
- [ ] Services métier (logique de récupération, cache)
- [ ] DTOs validation
- [ ] Tests unitaires + intégration

**Assignation** : Backend Dev  
**Livrable** : API référentiels fonctionnelle, documentée Swagger

#### 2.2. API Recherche Prestataires (Semaine 5, Jours 3-5)

- [ ] Controller Recherche (GET /prestataires avec filtres)
- [ ] Service recherche (géolocalisation PostGIS, filtres, tri)
- [ ] Filtrage abonnement actif (WHERE abonnementActif = true)
- [ ] Pagination (cursor-based)
- [ ] Requêtes optimisées (indexes géo)
- [ ] Tests performance

**Assignation** : Backend Dev  
**Livrable** : API recherche performante (<500ms), pagination fonctionnelle

#### 2.3. Frontend - Page Recherche (Semaine 6, Jours 1-3)

- [ ] Page /recherche (composants recherche)
- [ ] Filtres UI (secteur, sous-secteur, zone, distance)
- [ ] Liste résultats (cards prestataires)
- [ ] Carte Leaflet (affichage géolocalisé)
- [ ] Pagination frontend
- [ ] États de chargement/erreur

**Assignation** : Frontend Dev  
**Livrable** : Page recherche fonctionnelle, UX fluide

#### 2.4. API Fiche Prestataire (Semaine 6, Jours 1-2)

- [ ] Controller Prestataire (GET /prestataires/{id})
- [ ] Service fiche (infos complètes, services, zones, avis agrégés)
- [ ] DTOs réponse
- [ ] Cache fiche (Redis, TTL)

**Assignation** : Backend Dev  
**Livrable** : API fiche prestataire complète

#### 2.5. Frontend - Fiche Prestataire (Semaine 6, Jours 3-5)

- [ ] Page /prestataires/[id]
- [ ] Composants fiche (header, infos, services, carte zone, avis)
- [ ] CTA "Contacter" / "Commander"
- [ ] Responsive design
- [ ] SEO (meta tags, schema.org)

**Assignation** : Frontend Dev  
**Livrable** : Fiche prestataire complète, optimisée SEO

**Jalon Phase 2** : Recherche opérationnelle, fiches prestataires affichées, filtrage géolocalisé fonctionnel.

---

### PHASE 3: Authentification & Profils (Semaine 7)

**Objectif** : Système d'authentification et gestion des profils utilisateurs/prestataires.

#### 3.1. Backend - Auth (Semaine 7, Jours 1-2)

- [ ] Controller Auth (POST /auth/otp/request, /auth/otp/verify, /auth/logout)
- [ ] Service OTP (génération, validation, expiration)
- [ ] Service SMS/Email (envoi OTP)
- [ ] JWT Service (access + refresh tokens)
- [ ] Guards NestJS (JwtAuthGuard, RolesGuard)
- [ ] DTOs validation
- [ ] Tests auth (succès, échecs, expiration)

**Assignation** : Backend Dev  
**Livrable** : Système auth complet, sécurisé

#### 3.2. Frontend - Auth (Semaine 7, Jours 1-2)

- [ ] Pages auth (/login, /verify-otp)
- [ ] Formulaires (React Hook Form + Zod)
- [ ] Store Zustand (user state, tokens)
- [ ] Protected routes (middleware Next.js)
- [ ] Redirection après login

**Assignation** : Frontend Dev  
**Livrable** : Authentification frontend fonctionnelle

#### 3.3. Backend - Profils (Semaine 7, Jours 3-4)

- [ ] Controller Utilisateurs (GET/PATCH /users/me)
- [ ] Controller Prestataires (POST /prestataires, GET/PATCH /prestataires/me)
- [ ] Service profils (création, mise à jour, validation)
- [ ] Upload fichiers (logos, docs KYC → S3)
- [ ] Validation KYC (documents requis)

**Assignation** : Backend Dev  
**Livrable** : API profils opérationnelle

#### 3.4. Frontend - Profils (Semaine 7, Jours 3-5)

- [ ] Page profil utilisateur (/profile)
- [ ] Page profil prestataire (/prestataire/profile)
- [ ] Formulaires édition (composants réutilisables)
- [ ] Upload fichiers (UI + intégration S3)
- [ ] Affichage statut (KYC, abonnement)

**Assignation** : Frontend Dev  
**Livrable** : Pages profils fonctionnelles, UX intuitive

**Jalon Phase 3** : Authentification opérationnelle, profils créables/éditables, upload fichiers fonctionnel.

---

### PHASE 4: Abonnements & Paiements (Semaines 8-9)

**Objectif** : Système complet d'abonnements avec paiements Wave/Orange Money/espèces.

#### 4.1. Backend - Modèle Abonnements (Semaine 8, Jours 1)

- [ ] Models Prisma (PlanAbonnement, Abonnement, Paiement)
- [ ] Migrations Prisma
- [ ] Relations, contraintes (1 abonnement actif max)

**Assignation** : Backend Dev  
**Livrable** : Schéma DB abonnements complet

#### 4.2. Backend - API Plans & Abonnements (Semaine 8, Jours 2-3)

- [ ] Controller Plans (GET /abonnements/plans)
- [ ] Controller Abonnements (POST /abonnements, GET /prestataires/me/abonnement)
- [ ] Service abonnements (création, validation règles, expiration)
- [ ] Logique visibilité (abonnementActif flag)
- [ ] Tests unitaires

**Assignation** : Backend Dev  
**Livrable** : API abonnements de base fonctionnelle

#### 4.3. Backend - Intégration Wave API (Semaine 8, Jours 4-5)

- [ ] Service Wave (initiation paiement)
- [ ] Webhook Wave (confirmation paiement)
- [ ] Controller Paiements (POST /paiements/wave/initier)
- [ ] Controller Webhooks (POST /webhooks/wave/confirmation)
- [ ] Gestion retry/fallback
- [ ] Tests webhooks (sandbox)

**Assignation** : Backend Dev  
**Livrable** : Paiements Wave opérationnels (sandbox → production)

#### 4.4. Backend - Intégration Orange Money API (Semaine 9, Jours 1-2)

- [ ] Service Orange Money (initiation paiement)
- [ ] Webhook Orange Money (confirmation)
- [ ] Controller Paiements (POST /paiements/orange-money/initier)
- [ ] Controller Webhooks (POST /webhooks/orange-money/confirmation)
- [ ] Tests webhooks

**Assignation** : Backend Dev  
**Livrable** : Paiements Orange Money opérationnels

#### 4.5. Backend - Paiements Espèces (Semaine 9, Jours 2-3)

- [ ] Controller Paiements (POST /paiements/especes)
- [ ] Upload justificatif (S3)
- [ ] Service paiements espèces (création, état en_attente)
- [ ] Admin endpoints (GET /admin/paiements/especes/en-attente, POST /admin/paiements/{id}/valider|rejeter)
- [ ] Notifications (validation/rejet)

**Assignation** : Backend Dev  
**Livrable** : Workflow paiements espèces complet

#### 4.6. Backend - Jobs Expiration Abonnements (Semaine 9, Jours 3-4)

- [ ] Job cron (@nestjs/schedule) vérification expiration (quotidien)
- [ ] Job rappels (7j, 3j, jour J) via BullMQ
- [ ] Service expiration (suspension visibilité, notifications)
- [ ] Tests jobs (unitaires + intégration)

**Assignation** : Backend Dev  
**Livrable** : Système automatique expiration opérationnel

#### 4.7. Frontend - Abonnements (Semaine 9, Jours 2-5)

- [ ] Page plans abonnements (/abonnements/plans)
- [ ] Page souscription (/abonnements/souscrire)
- [ ] Composants paiement (Wave, Orange Money, Espèces)
- [ ] Intégration widgets paiement (Wave/OM)
- [ ] Page historique paiements (/prestataire/paiements)
- [ ] Notifications expiration (toasts, emails)

**Assignation** : Frontend Dev  
**Livrable** : Interface abonnements complète, paiements intégrés

**Jalon Phase 4** : Système abonnements complet, paiements Wave/OM/espèces fonctionnels, expiration automatique active.

---

### PHASE 5: Commandes & Avis (Semaine 10)

**Objectif** : Système de commandes et avis post-prestation.

#### 5.1. Backend - API Demandes/Commandes (Semaine 10, Jours 1-2)

- [ ] Controller Demandes (POST /demandes)
- [ ] Controller Commandes (POST /commandes, GET /commandes/{id}, PATCH /commandes/{id})
- [ ] Service commandes (création, statuts, workflows)
- [ ] Notifications commandes (BullMQ)
- [ ] Tests

**Assignation** : Backend Dev  
**Livrable** : API commandes opérationnelle

#### 5.2. Backend - API Avis (Semaine 10, Jours 2-3)

- [ ] Controller Avis (POST /avis, GET /prestataires/{id}/avis)
- [ ] Service avis (création, validation 1 avis/commande, agrégation notes)
- [ ] Modération admin (flag visible)
- [ ] Tests

**Assignation** : Backend Dev  
**Livrable** : API avis fonctionnelle

#### 5.3. Frontend - Commandes (Semaine 10, Jours 1-3)

- [ ] Page création demande (/demandes/nouvelle)
- [ ] Page détails commande (/commandes/[id])
- [ ] Suivi commande (statuts, notifications)
- [ ] Tableau bord prestataire (commandes reçues)

**Assignation** : Frontend Dev  
**Livrable** : Interface commandes complète

#### 5.4. Frontend - Avis (Semaine 10, Jours 3-5)

- [ ] Formulaire avis (post-commande)
- [ ] Affichage avis (fiche prestataire)
- [ ] Composants notation (étoiles, commentaire)
- [ ] Modération admin (interface)

**Assignation** : Frontend Dev  
**Livrable** : Système avis fonctionnel côté frontend

**Jalon Phase 5** : Commandes opérationnelles, avis postables, notifications fonctionnelles.

---

### PHASE 6: Admin & Finalisation (Semaine 11)

**Objectif** : Back-office admin, fonctionnalités finales, optimisations.

#### 6.1. Backend - API Admin (Semaine 11, Jours 1-2)

- [ ] Controller Admin Prestataires (POST /admin/prestataires/{id}/valider)
- [ ] Controller Admin Avis (DELETE /admin/avis/{id})
- [ ] Controller Admin Abonnements (stats, gestion plans)
- [ ] Guards admin (AdminGuard)
- [ ] Tests

**Assignation** : Backend Dev  
**Livrable** : API admin complète

#### 6.2. Frontend - Back-office Admin (Semaine 11, Jours 2-4)

- [ ] Page admin (/admin/dashboard)
- [ ] Gestion prestataires (liste, validation KYC)
- [ ] Modération avis (liste, suppression)
- [ ] Gestion abonnements (stats, validation espèces)
- [ ] Gestion plans (création, tarifs)

**Assignation** : Frontend Dev  
**Livrable** : Back-office admin fonctionnel

#### 6.3. PWA - Offline & Installabilité (Semaine 11, Jours 3-4)

- [ ] Configuration Workbox (Service Worker)
- [ ] Cache stratégies (shell, données)
- [ ] Web App Manifest
- [ ] Tests offline (recherche, fiches)
- [ ] Notifications Web Push (abonnements, commandes)

**Assignation** : Frontend Dev  
**Livrable** : PWA installable, offline fonctionnel

#### 6.4. Optimisations & SEO (Semaine 11, Jours 4-5)

- [ ] SSG pages publiques (secteurs, fiches prestataires)
- [ ] Sitemap dynamique
- [ ] Schema.org markup (LocalBusiness, Service)
- [ ] Optimisation images (Next.js Image)
- [ ] Performance audit (Lighthouse)

**Assignation** : Frontend Dev  
**Livrable** : SEO optimisé, Core Web Vitals OK

**Jalon Phase 6** : Back-office admin opérationnel, PWA installable, SEO optimisé.

---

### PHASE 7: Tests & Déploiement (Semaine 12)

**Objectif** : Tests complets, corrections, déploiement production.

#### 7.1. Tests E2E (Semaine 12, Jours 1-2)

- [ ] Setup Playwright/Cypress
- [ ] Parcours critiques (recherche → commande → avis)
- [ ] Parcours prestataire (inscription → abonnement → commandes)
- [ ] Parcours admin (validation, modération)
- [ ] Tests paiements (sandbox)

**Assignation** : QA + Devs  
**Livrable** : Suite tests E2E complète, tous parcours OK

#### 7.2. Tests Performance & Sécurité (Semaine 12, Jours 2-3)

- [ ] Load testing (k6, Artillery)
- [ ] Audit sécurité (OWASP, dépendances)
- [ ] Optimisations (requêtes DB, cache)
- [ ] Corrections bugs critiques

**Assignation** : DevOps + Backend Dev  
**Livrable** : Performance validée, sécurité OK

#### 7.3. Préparation Production (Semaine 12, Jours 3-4)

- [ ] Configuration Kubernetes (production)
- [ ] Variables environnement production
- [ ] Migrations DB production
- [ ] Backup/restore stratégies
- [ ] Monitoring production (alertes)

**Assignation** : DevOps  
**Livrable** : Infrastructure production prête

#### 7.4. Documentation & Formation (Semaine 12, Jours 4-5)

- [ ] Documentation API (Swagger complet)
- [ ] Guide utilisateur (prestataires, admin)
- [ ] Documentation déploiement
- [ ] Runbooks (incidents, maintenances)
- [ ] Formation équipe support

**Assignation** : Lead Dev + PO  
**Livrable** : Documentation complète, équipe formée

#### 7.5. Déploiement & Lancement (Semaine 12, Jour 5)

- [ ] Déploiement staging final
- [ ] Tests smoke production
- [ ] Déploiement production (blue-green)
- [ ] Monitoring post-déploiement
- [ ] Go-live !

**Assignation** : Toute l'équipe  
**Livrable** : Application en production, fonctionnelle

**Jalon Phase 7** : MVP lancé en production, monitoring actif, documentation complète.

---

## Organigramme des dépendances

```
[Phase 0] → [Phase 1] → [Phase 2] → [Phase 3]
                                        ↓
                            [Phase 4] ← ┘
                                        ↓
                            [Phase 5] ← ┘
                                        ↓
                            [Phase 6] ← ┘
                                        ↓
                            [Phase 7] ← ┘
```

**Dépendances critiques** :

- Phase 2 dépend de Phase 1 (DB, API base)
- Phase 3 dépend de Phase 1 (auth infrastructure)
- Phase 4 dépend de Phase 3 (profils prestataires)
- Phase 5 dépend de Phase 2 + 3 (recherche + auth)
- Phase 6 dépend de toutes les phases précédentes
- Phase 7 dépend de toutes les phases

---

## Répartition des ressources

### Semaines 1-2 (Phase 0)

- Designer : 100% (design système)
- DevOps : 50% (repos, CI/CD)
- Backend : 50% (architecture, DB)
- Frontend : 30% (setup base)

### Semaines 3-4 (Phase 1)

- Backend : 100% (NestJS, DB, Redis)
- Frontend : 100% (Next.js, layouts)
- DevOps : 80% (Docker, monitoring)

### Semaines 5-6 (Phase 2)

- Backend : 100% (API recherche, référentiels)
- Frontend : 100% (pages recherche, fiches)

### Semaine 7 (Phase 3)

- Backend : 100% (auth, profils)
- Frontend : 100% (pages auth, profils)

### Semaines 8-9 (Phase 4)

- Backend : 100% (abonnements, paiements, jobs)
- Frontend : 70% (UI abonnements)
- DevOps : 30% (config production APIs)

### Semaine 10 (Phase 5)

- Backend : 70% (commandes, avis)
- Frontend : 100% (UI commandes, avis)

### Semaine 11 (Phase 6)

- Backend : 50% (API admin)
- Frontend : 100% (back-office, PWA, SEO)

### Semaine 12 (Phase 7)

- Toute l'équipe : 100% (tests, déploiement, docs)

---

## Jalons & Critères d'acceptation

### Jalon 1 (Fin Phase 0)

- ✅ Design système validé par stakeholders
- ✅ Architecture technique documentée
- ✅ Schéma DB finalisé
- ✅ Accès APIs externes obtenus (sandbox)

### Jalon 2 (Fin Phase 1)

- ✅ Infrastructure complète (Docker, DB, Redis)
- ✅ Monitoring/logs opérationnels
- ✅ Environnements dev/staging fonctionnels

### Jalon 3 (Fin Phase 2)

- ✅ Recherche géolocalisée fonctionnelle (<500ms)
- ✅ Fiches prestataires affichées (avec filtrage abonnement)

### Jalon 4 (Fin Phase 3)

- ✅ Authentification OTP opérationnelle
- ✅ Profils utilisateurs/prestataires créables

### Jalon 5 (Fin Phase 4)

- ✅ Paiements Wave/Orange Money/espèces fonctionnels
- ✅ Système expiration automatique actif
- ✅ Visibilité conditionnelle opérationnelle

### Jalon 6 (Fin Phase 5)

- ✅ Commandes de bout en bout fonctionnelles
- ✅ Système avis opérationnel

### Jalon 7 (Fin Phase 6)

- ✅ Back-office admin fonctionnel
- ✅ PWA installable, offline OK
- ✅ SEO optimisé (score Lighthouse >90)

### Jalon 8 (Fin Phase 7 - GO LIVE)

- ✅ Tests E2E passés
- ✅ Performance validée
- ✅ Sécurité OK (audit)
- ✅ Production déployée et stable
- ✅ Documentation complète

---

## Risques & Mitigations

| Risque                     | Impact | Probabilité | Mitigation                                               |
| -------------------------- | ------ | ----------- | -------------------------------------------------------- |
| Retard intégration Wave/OM | Élevé  | Moyen       | Démarrer sandbox tôt (Phase 0), plan B manuel temporaire |
| Performance recherche      | Élevé  | Moyen       | Indexes PostGIS, cache Redis, tests charges Phase 7      |
| Complexité abonnements     | Élevé  | Faible      | Prototype tôt, revue architecture Phase 0                |
| Retard design système      | Moyen  | Faible      | Designer dédié Phase 0, composants réutilisables         |
| Bugs critiques production  | Élevé  | Faible      | Tests E2E, staging identique prod, rollback plan         |

---

## Métriques de suivi

### Vélocité par sprint

- Points de story complétés / semaine
- Taux complétion tâches (%)
- Bugs détectés / résolus

### Qualité

- Couverture tests (objectif ≥70%)
- Score Lighthouse (objectif ≥90)
- Vulnerabilités critiques (objectif = 0)

### Performance

- TTFB API (objectif <500ms p95)
- LCP frontend (objectif <2.5s p75)
- Temps build CI/CD (objectif <10min)

---

## Communication & Reporting

### Réunions quotidiennes (15min)

- Stand-up : blocages, avancement, dépendances

### Réunions hebdomadaires (1h)

- Revue sprint : démo fonctionnalités, rétrospective
- Planification : prochaines tâches, ajustements

### Réunions jalons (2h)

- Démo complète
- Validation critères d'acceptation
- Go/No-Go phase suivante

---

## Notes importantes

- **Flexibilité** : Ce plan est indicatif, ajustements possibles selon retours
- **Priorisation** : Features critiques MVP d'abord, évolutions post-MVP ensuite
- **Qualité** : Pas de compromis sur sécurité et tests
- **Documentation** : Maintenue à jour au fil de l'eau
- **Communication** : Transparence sur blocages, délais estimés réalistes

---

**Document créé le** : [Date]  
**Dernière mise à jour** : [Date]  
**Version** : 1.0 (MVP)
