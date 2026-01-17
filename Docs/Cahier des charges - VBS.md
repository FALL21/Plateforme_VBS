## Cahier des charges — VOS BESOINS SERVICES (VBS)

### 1. Contexte et objectifs

VBS est une plateforme web (PWA) de mise en relation entre utilisateurs et prestataires de services au Sénégal, visant à fournir des recommandations pertinentes selon le besoin et la position.
 
Objectifs :
- Réduire le temps de recherche d’un prestataire fiable.
- Maximiser la pertinence via la géolocalisation et le filtrage.
- Offrir une expérience simple, rapide, fiable, accessible hors-ligne (PWA) et multi-device.

### 2. Périmètre fonctionnel (MVP)

- Recherche de services par secteur/sous-secteur, mot-clé, position.
- Listings et fiches prestataires (infos, zones, tarifs indicatifs, avis/notes).
- **Système d’abonnements prestataires** (mensuel/annuel) avec gestion de visibilité sur la plateforme.
- **Paiements d’abonnements** via Wave, Orange Money ou espèces (avec validation manuelle admin pour espèces).
- **Visibilité conditionnelle**: seuls les prestataires avec abonnement actif apparaissent dans les résultats de recherche.
- Création de demande/commande simple avec confirmation et suivi basique.
- Système d’avis après prestation (note + commentaire).
- Authentification utilisateurs et prestataires (email/téléphone + OTP).
- Géolocalisation (avec consentement) et calcul de distance.
- Tableau de bord prestataire minimal (disponibilité, secteurs, zones, tarifs indicatifs, gestion abonnement, historique paiements).
- Back-office admin basique (validation prestataires, modération avis, taxonomie secteurs, gestion abonnements, validation paiements espèces).
- PWA: installable, cache offline pour UI et derniers résultats, notifications web.

Évolutions post-MVP (itérations):

- Messagerie intégrée client-prestataire, planification de rendez-vous.
- Paiement in‑app pour commandes, facturation, bons de commande.
- Filtres avancés (prix, délai, dispo temps réel), notation pondérée.
- Niveaux d’abonnements (basic, premium, premium+) avec avantages différenciés (mise en avant sponsorisée, statistiques avancées, etc.).

### 3. Rôles et permissions

- Visiteur: recherche, consultation fiches, installation PWA.
- Utilisateur: tout visiteur + création demandes, avis, gestion profil.
- Prestataire: gestion profil pro, disponibilité, offres, consultation demandes reçues.
- Admin: gestion taxonomie, validation prestataires, modération, reporting.

### 4. Parcours utilisateurs (principaux)

- Recherche: besoin → localisation (consentement) → résultats pertinents → filtres → fiche → contact/commande.
- Commande: sélection service → précision du besoin → choix prestataire → confirmation → suivi → avis.
- Prestataire: inscription → vérification → complétion profil → activation secteurs/zones → **souscription abonnement (Wave/Orange Money/espèces)** → activation visibilité → réception demandes.
- Renouvellement abonnement: notification avant expiration → paiement → prolongation automatique (si paiement digital) ou validation admin (si espèces).

### 5. Exigences fonctionnelles détaillées

- **Modèle économique et abonnements**:

  - Abonnements mensuels ou annuels pour prestataires (tarification configurable par admin).
  - Visibilité conditionnelle: seuls les prestataires avec abonnement **actif** apparaissent dans les résultats de recherche et listings publics.
  - Gestion expiration: rappels avant expiration (7 jours, 3 jours, jour J), suspension automatique de visibilité à l’expiration.
  - Renouvellement automatique si paiement digital validé, sinon en attente validation admin (espèces).

- **Paiements abonnements**:

  - **Wave**: intégration API Wave pour paiements en ligne, webhook de confirmation.
  - **Orange Money**: intégration API Orange Money pour paiements mobiles, webhook de confirmation.
  - **Espèces**: prestataire indique paiement espèces, upload justificatif (reçu, capture écran), validation manuelle par admin avec notification prestataire.
  - Historique paiements consultable par prestataire et admin.
  - Règles: un seul abonnement actif par prestataire, chevauchement géré (prorata ou report).

- Catalogue services/secteurs: hiérarchie secteurs → sous-secteurs; attributs par service (durée, indoor/outdoor, équipement, etc.).
- Prestataires: statut (vérifié, abonnement actif/expiré/en attente), documents (KYC), zones desservies (polygones ou communes), calendrier dispo.
- Matching: tri par pertinence (distance, note, activité récente, adéquation service/zone), **filtrage automatique des prestataires sans abonnement actif**, pagination.
- Avis: 1 avis par commande, modération par admin, agrégation de note.
- Notifications: email/SMS (OTP, expiration abonnement, confirmation paiement), web push (PWA) pour MAJ statut commande et abonnement.

### 6. Exigences non-fonctionnelles (NFR)

- **Performance** : TTFB < 500 ms (p95), LCP < 2.5 s (p75) via **Next.js SSR**, pagination serveur, cache **Redis** pour requêtes fréquentes.
- **Disponibilité** : 99.5% MVP, montée à 99.9% avec réplication **PostgreSQL** et **Kubernetes**.
- **Sécurité** : OWASP Top 10, **@nestjs/throttler** (rate limiting), CSP, stockage chiffré secrets, RGPD-like (consentement, droit d’effacement).
- **PWA** : manifest, Service Worker **Workbox** (CacheFirst pour shell, StaleWhileRevalidate pour données), offline basique.
- **Accessibilité** : WCAG 2.1 AA, **Tailwind CSS** + **shadcn/ui** (contrastes renforcés, lisibilité).
- **SEO** : **Next.js SSR/SSG** pages publiques, sitemap, balisage schema.org (LocalBusiness, Service).
- **Localisation** : fr par défaut, extensible wolof/en (i18n Next.js).

### 7. Architecture technique — MVC (de référence, adaptable)

#### 7.1. Architecture MVC — Vue d'ensemble

La plateforme suit une architecture **MVC (Model-View-Controller)** permettant une séparation claire des responsabilités :

- **Model** : Logique métier, accès données, règles de gestion
- **View** : Interface utilisateur (PWA frontend avec composants React/Vue)
- **Controller** : Orchestration des requêtes, coordination Model ↔ View, validation

**Flux MVC typique** :

```
Utilisateur (View - Next.js)
    ↓ [Action utilisateur]
Controller (NestJS API)
    ↓ [Appel Service]
Service (Logique métier NestJS)
    ↓ [Requête Prisma ORM]
Model (PostgreSQL + PostGIS via Prisma)
    ↓ [Retour données]
Controller (Format réponse JSON)
    ↓ [HTTP Response]
View (Next.js - Mise à jour UI)
```

**Avantages MVC pour VBS** :

- Séparation claire : chaque couche a sa responsabilité
- Maintenabilité : modifications isolées par couche
- Testabilité : tests unitaires par couche facilités
- Scalabilité : possibilité de scaling indépendant (ex: serveur API séparé)
- Réutilisabilité : services métier réutilisables par plusieurs controllers

#### 7.2. Couche View (Frontend PWA)

**Technologies retenues** :

- **Framework** : **Next.js 14+** (React) avec App Router, **TypeScript**
- **Styling** : **Tailwind CSS** + **shadcn/ui** (composants pré-construits, responsive)
- **PWA** : Service Worker via **Workbox**, Web App Manifest, cache stratégies (CacheFirst pour shell, StaleWhileRevalidate pour données)
- **État global** : **Zustand** (léger, performant) pour state management
- **Validation formulaires** : **React Hook Form** + **Zod** (validation type-safe)
- **Cartes/Géo** : **Leaflet.js** + **OpenStreetMap** (gratuit, open-source)
- **HTTP Client** : Fetch API avec interceptors pour auth/erreurs (ou Axios si besoin)
- **Build** : Next.js Turbopack (bundling rapide, intégré à Next.js)

**Structure View** :

```
app/ (Next.js App Router)
  ├── components/          # Composants réutilisables (shadcn/ui)
  │   ├── ui/             # Composants UI de base (shadcn)
  │   └── ...             # Composants métier
  ├── (routes)/           # Pages/écrans principaux (groupes de routes)
  ├── layouts/            # Layouts (header, footer, sidebar)
  ├── hooks/              # Custom hooks React réutilisables
  ├── lib/                # Utilitaires, configurations
  │   ├── api.ts         # API client (Fetch avec interceptors)
  │   └── ...
  └── public/             # Assets statiques
```

#### 7.3. Couche Controller (Backend API)

**Technologies retenues** :

- **Framework** : **NestJS** (TypeScript) avec structure MVC native
- **Langage** : TypeScript strict mode
- **Validation** : **class-validator** + **class-transformer** (intégré NestJS)
- **ORM** : **Prisma ORM** (type-safe, migrations intégrées)
- **API** : RESTful (MVP), documentation automatique via Swagger
- **Auth** : JWT (access + refresh tokens), OTP via services SMS/Email
- **RBAC** : Guards NestJS + Policies pour contrôle d'accès
- **Rate Limiting** : **@nestjs/throttler** (limitation requêtes par IP/utilisateur)
- **Documentation API** : **Swagger/OpenAPI** (génération automatique via @nestjs/swagger)

**Structure Controller** :

```
src/
  ├── controllers/        # Contrôleurs (gestion requêtes/réponses)
  │   ├── auth.controller.ts
  │   ├── prestataires.controller.ts
  │   ├── abonnements.controller.ts
  │   └── ...
  ├── services/          # Services métier (logique business)
  │   ├── auth.service.ts
  │   ├── abonnement.service.ts
  │   └── ...
  ├── dto/               # Data Transfer Objects (validation entrées)
  ├── guards/            # Guards (auth, rôles)
  ├── interceptors/      # Interceptors (logging, transformation)
  └── filters/           # Exception filters (gestion erreurs)
```

#### 7.4. Couche Model (Data Layer)

**Technologies retenues** :

- **Base de données principale** : **PostgreSQL 15+** (relations, ACID, performance)
- **Extension géospatiale** : **PostGIS** (calculs distances, polygones zones, requêtes géolocalisées)
- **ORM** : **Prisma ORM** (type-safe, génération TypeScript automatique)
- **Migrations** : **Prisma Migrate** (versioning schéma, migrations incrémentales)
- **Cache** : **Redis 7+** (sessions, rate limiting, cache query fréquentes)
- **Queue Jobs** : **BullMQ** (Redis-based) pour jobs asynchrones (emails, notifications, tâches lourdes)
- **Recherche full-text** : PostgreSQL full-text search (MVP, intégré)

**Structure Model** :

```
prisma/
  ├── schema.prisma       # Schéma Prisma (models, relations, indexes)
  │   ├── model User
  │   ├── model Prestataire
  │   ├── model Abonnement
  │   └── ...
  └── migrations/         # Migrations Prisma (versioning automatique)
      ├── 20240101_initial/
      └── ...
```

#### 7.5. Services externes & intégrations

- **Paiements digitaux** :
  - **Wave API** : intégration REST avec webhooks de confirmation, gestion retry/fallback
  - **Orange Money API** : intégration REST avec webhooks de confirmation, gestion retry/fallback
- **Notifications** :
  - **Web Push** (PWA) : notifications navigateur pour commandes, expirations abonnements
  - **Email** : **SendGrid** ou **Resend** (transactionnel, templates)
  - **SMS** : fournisseur local Sénégal (OTP, notifications importantes)
- **Stockage fichiers** : **S3-compatible** (**DigitalOcean Spaces** ou **AWS S3**) pour logos, docs KYC, justificatifs paiements
- **CDN** : **Cloudflare CDN** (assets statiques, amélioration performance globale)

#### 7.6. Jobs planifiés & tâches asynchrones

- **Scheduler** : **@nestjs/schedule** (intégré NestJS, basé sur node-cron)
- **Queue system** : **BullMQ** (Redis-backed) pour tâches asynchrones lourdes
- Jobs principaux (via @nestjs/schedule + BullMQ) :
  - Vérification expiration abonnements (cron quotidien 00:00)
  - Envoi rappels expiration (7j, 3j, jour J avant expiration)
  - Nettoyage données temporaires (hebdomadaire)
  - Génération rapports/statistiques (quotidien/hebdomadaire)

#### 7.7. Observabilité & monitoring

- **Logs** : **Pino** ou **Winston** (logs structurés JSON, performance optimisée)
- **APM/Tracing** : **OpenTelemetry** (standard ouvert) + Jaeger (visualisation traces)
- **Monitoring** : **Prometheus** (collecte métriques) + **Grafana** (dashboards, alertes)
- **Erreurs** : **Sentry** (tracking erreurs frontend Next.js + backend NestJS, alertes temps réel)

#### 7.8. Déploiement & DevOps

- **Conteneurisation** : **Docker** (images slim, multi-stage builds) + Docker Compose (dev/staging)
- **Orchestration** : **Kubernetes** (production, scaling automatique, rolling updates)
- **CI/CD** : **GitHub Actions** (workflows automatisés : build, tests, scans, déploiement)
- **Environnements** : dev, staging, production (variables d'environnement via .env, secrets managés)
- **Registre images** : Docker Hub ou GitHub Container Registry (GHCR)

#### 7.9. Sécurité

- **HTTPS/TLS** : Certificats SSL (Let's Encrypt ou services managés), TLS 1.2+ minimum
- **CORS** : Configuration stricte selon domaines autorisés (Next.js API Routes + NestJS)
- **CSRF** : Protection CSRF tokens (Next.js natif, middleware NestJS)
- **Headers sécurité** : **@nestjs/helmet** (headers sécurisés automatiques)
- **Validation inputs** : Validation stricte côté serveur via **class-validator** (NestJS) et **Zod** (frontend), jamais faire confiance au client
- **Secrets** : Variables d'environnement (.env), secrets Kubernetes ou Vault (production)
- **Rate Limiting** : **@nestjs/throttler** (protection DDoS, brute force)

#### 7.10. Technologies recommandées (verrouillées MVP)

- **Frontend (View)** : Next.js 14+ (React, TypeScript), Tailwind CSS, shadcn/ui, Workbox (PWA), Zustand, React Hook Form + Zod, Leaflet + OpenStreetMap
- **Backend (Controller)** : NestJS (TypeScript), Swagger/OpenAPI, class-validator, @nestjs/throttler
- **Données (Model)** : PostgreSQL 15+, PostGIS, Prisma ORM, Prisma Migrate
- **Cache & Jobs** : Redis 7+, BullMQ, @nestjs/schedule
- **Paiements** : Wave API, Orange Money API (webhooks)
- **Notifications** : Web Push (PWA), Email (SendGrid/Resend), SMS (fournisseur local)
- **Stockage** : S3-compatible (DO Spaces / AWS S3), CDN Cloudflare
- **Observabilité** : Pino/Winston, OpenTelemetry, Sentry, Prometheus + Grafana
- **DevOps** : Docker, GitHub Actions (CI/CD), Kubernetes (prod)

Politique de maintenance: versions LTS/actives uniquement, mises à jour de sécurité mensuelles, audits trimestriels (dépendances, vulnérabilités), environnement staging obligatoire avant prod.

### 8. Modèle de données (vue logique)

- Secteur(id, nom, slug) → SousSecteur(id, nom, slug, secteurId)
- Service(id, sousSecteurId, nom, attributsJSON, actif)
- Prestataire(id, raisonSociale, kycStatut, noteMoy, zonesGeo, dispo, userId, abonnementActif)
- **Abonnement(id, prestataireId, type [mensuel/annuel], dateDebut, dateFin, statut [actif/expiré/en_attente], tarif, createdAt)**
- **Paiement(id, abonnementId, prestataireId, methode [wave/orange_money/especes], montant, statut [en_attente/valide/rejete], referenceExterne [transactionId Wave/Orange], justificatifUrl [pour espèces], valideParAdminId, dateValidation, createdAt)**
- **PlanAbonnement(id, nom, type [mensuel/annuel], prix, actif)**
- PrestataireService(prestataireId, serviceId, tarifIndicatif, delai)
- Utilisateur(id, email/tel, role, adresseGeo, consentements)
- Demande(id, utilisateurId, serviceId, zone, statut, createdAt)
- Commande(id, demandeId, prestataireId, statut, rdvAt, prix, transactions)
- Avis(id, commandeId, note, commentaire, visible)
- AdminAction(id, type, cibleId, meta)

Contraintes clés: intégrité référentielle, unicité slug, 1 avis/commande, **1 abonnement actif max par prestataire**, index géo sur zones/positions, **index sur dateFin abonnement pour requêtes expiration**.

### 9. API (MVP — endpoints REST indicatifs)

- Auth: POST /auth/otp/request, POST /auth/otp/verify, POST /auth/logout
- Référentiels: GET /secteurs, GET /secteurs/{id}/sous-secteurs, GET /services?sousSecteur=…
- Recherche: GET /prestataires?serviceId=…&lat=…&lng=…&rayon=…&tri=… (retourne uniquement prestataires avec abonnement actif)
- Prestataires: GET /prestataires/{id}, POST /prestataires (inscription), PATCH /prestataires/{id}
- **Abonnements**:
  - GET /abonnements/plans (liste plans disponibles)
  - POST /abonnements (créer/souscrire abonnement)
  - GET /prestataires/me/abonnement (mon abonnement actuel)
  - POST /abonnements/{id}/renouveler
  - GET /prestataires/me/historique-paiements
- **Paiements**:
  - POST /paiements/wave/initier (initie paiement Wave)
  - POST /paiements/orange-money/initier (initie paiement Orange Money)
  - POST /webhooks/wave/confirmation (webhook Wave)
  - POST /webhooks/orange-money/confirmation (webhook Orange Money)
  - POST /paiements/especes (déclarer paiement espèces + upload justificatif)
- Demandes/Commandes: POST /demandes, POST /commandes, GET /commandes/{id}, PATCH /commandes/{id}
- Avis: POST /avis, GET /prestataires/{id}/avis
- Admin:
  - POST /admin/prestataires/{id}/valider
  - DELETE /admin/avis/{id}
  - GET /admin/paiements/especes/en-attente (liste paiements espèces à valider)
  - POST /admin/paiements/{id}/valider (valider paiement espèces)
  - POST /admin/paiements/{id}/rejeter (rejeter paiement espèces)
  - GET /admin/abonnements/statistiques (stats abonnements actifs/expirés)
  - PATCH /admin/abonnements/plans/{id} (gérer tarifs plans)

Réponses paginées (cursor/limit), erreurs normalisées (code, message, champ), auth Bearer.

### 10. Sécurité & conformité

- Auth: OTP + token courte durée, refresh sécurisé, rotation des tokens.
- Autorisations: RBAC (visiteur, utilisateur, prestataire, admin) avec vérifications par ressource.
- Données perso: minimisation, rétention limitée, export/effacement sur demande.
- Chiffrement: TLS 1.2+, hash mots de passe (si utilisés), secrets via vault.
- Anti-abus: rate limiting IP/utilisateur, captcha invisible, audit logs admin.

### 11. Qualité, tests, CI/CD

- **Tests** : unitaires (≥70% MVP) via Jest/Vitest, intégration API clés (NestJS), e2e parcours critique (Playwright/Cypress).
- **Qualité** : ESLint/Prettier, **TypeScript strict mode**, commit lint (conventional commits), review obligatoire.
- **CI/CD** : **GitHub Actions** workflows (build Next.js + NestJS, tests, scan vulnérabilités, déploiement staging → prod avec approbation).

### 12. Déploiement & hébergement

- **Conteneurisation** : **Docker** (images slim multi-stage), SBOM (Software Bill of Materials).
- **Infra** : DB managée (**PostgreSQL 15+** + **PostGIS**), **S3-compatible** (stockage objets), **Cloudflare CDN**.
- **Stratégies** : **Kubernetes** blue‑green/rolling deployments, migrations **Prisma Migrate** zero‑downtime, sauvegardes automatiques, réplication PostgreSQL.

### 13. KPI & analytics

- **Abonnements**: taux conversion inscription → souscription abonnement, taux renouvellement, CA mensuel/annuel (MRR/ARR), nombre prestataires actifs/expirés, délai moyen paiement espèces (validation admin).
- Taux conversion recherche → contact/commande, délai moyen mise en relation.
- Taux rétention utilisateurs/prestataires, note moyenne par secteur.
- **Répartition paiements**: % Wave vs Orange Money vs espèces, taux échec paiements digitaux.
- Core Web Vitals, taux installation PWA, taux opt‑in notifications.

### 14. Planning & livrables (indicatif)

- Semaine 1‑2: cadrage, taxonomie secteurs, design système, archi, **intégrations Wave/Orange Money (sandbox)**.
- Semaine 3‑6: MVP front/back, recherche, fiches, demandes/commandes basiques.
- Semaine 5‑6: **système abonnements, paiements (Wave/Orange Money/webhook, espèces), visibilité conditionnelle, jobs cron expiration**.
- Semaine 7‑8: avis, back‑office admin (validation espèces inclus), PWA offline, accessibilité.
- Semaine 9: tests e2e, perf, sécurité, préparation déploiement.
- Semaine 10: lancement MVP, suivi KPI, itérations correctives.

Livrables: code source, documentation API, schéma données, playbook runbooks, guides prestataires/admin.

### 15. Critères d’acceptation (MVP)

- Recherche géolocalisée opérationnelle avec tri pertinence et pagination **excluant automatiquement les prestataires sans abonnement actif**.
- **Système d’abonnements opérationnel**: souscription, paiements Wave/Orange Money/espèces, gestion expiration, renouvellement.
- **Visibilité conditionnelle**: prestataires non abonnés/inactifs invisibles dans recherches/listings publics.
- **Validation admin paiements espèces**: upload justificatif, workflow validation/rejet avec notifications.
- Fiches prestataires complètes + avis post‑commande.
- Création demande/commande de bout en bout avec notifications.
- PWA installable, offline shell + derniers résultats, web push fonctionnel.
- Back‑office admin pour valider prestataires, modérer avis, gérer abonnements et valider paiements espèces.

### 16. Risques & mitigations

- Qualité données prestataires: KYC, vérification manuelle initiale.
- **Paiements digitaux**: gestion échecs, retry automatique, fallback support manuel, logs détaillés transactions.
- **Paiements espèces**: délai validation admin (SLA max 24-48h), communication claire au prestataire, traçabilité justificatifs.
- **Expiration abonnements**: rappels proactifs, grâce période optionnelle (ex: 3 jours), réactivation rapide post-paiement.
- Couverture géo: démarrer zones pilotes, élargir progressivement.
- Adoption PWA: UX onboarding + incitation installation, focus performance.
- Sécurité: audits réguliers, correctifs rapides, monitoring proactif, **chiffrement données paiements, conformité standards paiement mobile (PCI-DSS si applicable)**.

### 17. Modèle économique détaillé

- **Abonnements prestataires**:

  - Abonnement mensuel: tarif configurable par admin (ex: 5000-15000 FCFA/mois selon secteur/zone).
  - Abonnement annuel: tarif avec remise (ex: -20% vs mensuel).
  - Visibilité aide: prestataire n’apparaît dans résultats que si abonnement actif.
  - Période d’essai optionnelle: 7-14 jours gratuits pour nouveaux prestataires (optionnel MVP).

- **Méthodes de paiement**:

  - **Wave**: paiement mobile via API Wave, confirmation instantanée via webhook, activé automatiquement.
  - **Orange Money**: paiement mobile via API Orange Money, confirmation instantanée via webhook, activé automatiquement.
  - **Espèces**: déclaration manuelle prestataire + upload justificatif, validation admin requise (SLA 24-48h), notification prestataire à validation/rejet.

- **Règles de gestion**:
  - Un seul abonnement actif par prestataire à la fois.
  - En cas de renouvellement avant expiration: prorata ou report de la date de fin.
  - Suspension automatique visibilité à expiration (job cron quotidien).
  - Notification automatique 7 jours avant expiration, puis 3 jours, puis jour J.

### 18. Annexes

- Glossaire secteurs/sous‑secteurs.
- Références accessibilité et SEO.
- **Documentation intégrations Wave et Orange Money (endpoints, webhooks, gestion erreurs)**.
- Politique de versionnage et migrations de schéma.
