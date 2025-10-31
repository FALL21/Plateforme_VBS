# 🚀 Instructions de Démarrage - Plateforme VBS

## 📋 Prérequis

- Node.js 18+ installé
- npm ou yarn
- Docker et Docker Compose installés
- Git

## ⚡ Démarrage Rapide (5 minutes)

### Étape 1: Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Étape 2: Configuration de l'environnement

#### Backend - Créer `backend/.env`

```env
DATABASE_URL="postgresql://vbs_user:vbs_password@localhost:5432/vbs_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="votre-secret-jwt-tres-securise-changez-moi"
JWT_REFRESH_SECRET="votre-refresh-secret-tres-securise-changez-moi"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# APIs externes (à configurer plus tard)
WAVE_API_URL="https://api.wave.com/v1"
WAVE_API_KEY=""
WAVE_WEBHOOK_SECRET=""

ORANGE_MONEY_API_URL="https://api.orange.com/orange-money-webpay"
ORANGE_MONEY_API_KEY="239"
ORANGE_MONEY_WEBHOOK_SECRET=""

EMAIL_API_KEY=""
SMS_PROVIDER_API_KEY=""

# S3 (à configurer)
S3_ENDPOINT=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="vbs-storage"
```

#### Frontend - Créer `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Étape 3: Démarrer l'infrastructure Docker

```bash
# Depuis la racine Plateforme_VBS/
docker-compose up -d postgres redis
```

Attendre quelques secondes que PostgreSQL et Redis soient prêts.

### Étape 4: Initialiser la base de données

```bash
cd backend

# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# Charger les données de base (seed)
npm run prisma:seed
```

### Étape 5: Lancer les serveurs

#### Terminal 1 - Backend

```bash
cd backend
npm run start:dev
```

Le backend sera accessible sur : **http://localhost:4000**
Swagger API : **http://localhost:4000/api**

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur : **http://localhost:3000**

## ✅ Vérification

1. **Backend** : Ouvrir http://localhost:4000/api - Vous devriez voir Swagger
2. **Frontend** : Ouvrir http://localhost:3000 - Vous devriez voir la page d'accueil
3. **Test API** : Dans Swagger, tester `GET /api/secteurs` - Devrait retourner les secteurs

## 🔍 Tests des Fonctionnalités

### Test Auth (OTP)

1. Aller sur http://localhost:3000/login
2. Entrer un numéro de téléphone (ex: +221771234567) ou email
3. Cliquer "Envoyer le code"
4. Dans la console backend, copier le code OTP affiché
5. Entrer le code et vérifier
6. Vous êtes connecté !

### Test Recherche Prestataires

1. Aller sur http://localhost:3000/recherche
2. La recherche devrait fonctionner (vide pour l'instant, aucun prestataire)

### Test API directement

1. Ouvrir Swagger : http://localhost:4000/api
2. Tester les endpoints :
   - `GET /secteurs` → Liste des secteurs
   - `GET /services` → Liste des services
   - `POST /auth/otp/request` → Demander un OTP

## 🐛 Dépannage

### Erreur "Cannot connect to database"

```bash
# Vérifier que PostgreSQL est démarré
docker ps

# Redémarrer si besoin
docker-compose restart postgres
```

### Erreur "Prisma Client not generated"

```bash
cd backend
npx prisma generate
```

### Erreur "Port already in use"

Changer le port dans `.env` :
- Backend : `PORT=4001`
- Frontend : Modifier dans `package.json` ou config Next.js

### Erreur CORS

Vérifier que `CORS_ORIGIN` dans `backend/.env` correspond à l'URL du frontend.

## 📝 Prochaines Étapes

1. Créer un compte utilisateur via login
2. Créer un profil prestataire
3. Souscrire un abonnement
4. Tester les paiements (sandbox)
5. Créer des demandes/commandes

## 🔗 URLs Utiles

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000/api
- **Swagger** : http://localhost:4000/api
- **Prisma Studio** : `cd backend && npx prisma studio` → http://localhost:5555

---

**Tout est prêt ! Bon développement ! 🚀**

