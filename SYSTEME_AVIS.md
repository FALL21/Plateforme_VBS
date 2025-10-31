# 📊 Système d'Avis Client - VBS

## ✅ Fonctionnalités implémentées

### 🔧 Backend - API Endpoints

#### **Créer un avis**
```
POST /api/avis
```
- **Rôle requis**: CLIENT (USER)
- **Body**:
  ```json
  {
    "commandeId": "uuid",
    "note": 1-5,
    "commentaire": "string (optionnel)"
  }
  ```
- **Validations**:
  - ✅ La commande doit exister
  - ✅ La commande doit appartenir à l'utilisateur
  - ✅ La commande doit être terminée
  - ✅ Un seul avis par commande

#### **Récupérer les avis d'un prestataire**
```
GET /api/avis/prestataire/:prestataireId
```
- **Public** (pas d'authentification requise)
- **Retourne**: Liste des avis visibles avec informations utilisateur

#### **Récupérer l'avis d'une commande**
```
GET /api/avis/commande/:commandeId
```
- **Public**
- **Retourne**: L'avis associé à une commande spécifique

### 🎨 Frontend - Interface utilisateur

#### **1. Dashboard Client** (`/client/dashboard`)

**Section "Commandes à évaluer"**
- ✅ Liste des commandes terminées sans avis
- ✅ Bouton "⭐ Laisser un avis" pour chaque commande
- ✅ Affichage du prestataire, prix et date
- ✅ Rechargement automatique après avoir laissé un avis

#### **2. Modal d'évaluation** (`AvisModal.tsx`)

**Composant réutilisable avec**:
- ✅ Sélection de note par étoiles (1-5)
  - Hover effect pour prévisualiser
  - Labels descriptifs:
    - 1 étoile: "Très insatisfait"
    - 2 étoiles: "Insatisfait"
    - 3 étoiles: "Moyen"
    - 4 étoiles: "Satisfait"
    - 5 étoiles: "Très satisfait"
- ✅ Champ commentaire optionnel (textarea)
- ✅ Affichage du nom du prestataire
- ✅ Gestion des erreurs
- ✅ État de chargement
- ✅ Validation côté client

#### **3. Page Détail Prestataire** (`/prestataires/[id]`)

**Section "Avis clients"**
- ✅ Affichage du nombre total d'avis
- ✅ Liste des avis avec:
  - Note en étoiles (composant RatingStars)
  - Nom/téléphone de l'utilisateur
  - Date de publication
  - Commentaire (si présent)
- ✅ Message "Aucun avis pour le moment" si vide

### 🔄 Mise à jour automatique

**Note moyenne du prestataire**:
- ✅ Recalculée automatiquement après chaque nouvel avis
- ✅ Arrondie à 1 décimale
- ✅ Mise à jour du champ `noteMoyenne` dans la table `Prestataire`
- ✅ Mise à jour du champ `nombreAvis`

## 📊 Modèle de données

### Table `Avis`
```prisma
model Avis {
  id            String    @id @default(uuid())
  commandeId    String    @unique        // Un seul avis par commande
  prestataireId String
  utilisateurId String
  note          Int       // 1-5
  commentaire   String?   // Optionnel
  visible       Boolean   @default(true) // Modération admin
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  commande      Commande     @relation(...)
  prestataire   Prestataire  @relation(...)
  utilisateur   User         @relation(...)
}
```

## 🔒 Sécurité & Validations

### Backend
- ✅ Authentication JWT requise pour créer un avis
- ✅ Guard de rôle: seuls les CLIENTS peuvent créer des avis
- ✅ Vérification de propriété de la commande
- ✅ Vérification du statut de la commande (TERMINEE)
- ✅ Prévention des avis multiples sur une même commande
- ✅ Validation DTO avec class-validator:
  - Note: entier entre 1 et 5
  - Commentaire: string optionnel

### Frontend
- ✅ Validation côté client avant soumission
- ✅ Gestion des erreurs avec messages utilisateur
- ✅ État de chargement pour éviter les double-soumissions
- ✅ Modal fermable (ESC ou bouton)

## 🎯 Workflow utilisateur

1. **Client termine une commande** → Statut: `TERMINEE`
2. **Dashboard client** → Section "Commandes à évaluer"
3. **Click "Laisser un avis"** → Modal s'ouvre
4. **Sélection note + commentaire** → Soumission
5. **Avis créé** → Note moyenne prestataire mise à jour
6. **Avis visible** → Page détail du prestataire + dashboard

## 📈 Impact sur les prestataires

### Calcul de la note moyenne
```typescript
const noteMoyenne = 
  avis.reduce((sum, a) => sum + a.note, 0) / avis.length;
  
// Arrondi à 1 décimale
const noteArrondie = Math.round(noteMoyenne * 10) / 10;
```

### Affichage
- ✅ Badge étoiles avec note sur les cartes prestataires
- ✅ Nombre d'avis affiché
- ✅ Section complète des avis sur la page détail
- ✅ Dashboard prestataire: statistiques "Réputation"

## 🧪 Test de la fonctionnalité

### Scénario de test

1. **Connexion client**: `+221770001000` / OTP: `123456`
2. **Dashboard client**: Vérifier section "Commandes à évaluer"
3. **Créer un avis**:
   - Sélectionner une note (1-5)
   - Ajouter un commentaire
   - Soumettre
4. **Vérifier**:
   - Commande disparaît de "À évaluer"
   - Stat "Avis publiés" incrémentée
   - Avis visible sur page prestataire
   - Note moyenne mise à jour

### Endpoints à tester

```bash
# Créer un avis (authentifié)
POST http://localhost:4000/api/avis
Content-Type: application/json
Authorization: Bearer <token>
{
  "commandeId": "uuid-de-la-commande",
  "note": 5,
  "commentaire": "Excellent service, très professionnel!"
}

# Récupérer les avis d'un prestataire
GET http://localhost:4000/api/avis/prestataire/uuid-du-prestataire

# Récupérer l'avis d'une commande
GET http://localhost:4000/api/avis/commande/uuid-de-la-commande
```

## 🚀 Prochaines améliorations possibles

- [ ] Modération admin des avis (masquer/afficher)
- [ ] Réponse du prestataire aux avis
- [ ] Signalement d'avis inappropriés
- [ ] Filtrage des avis (par note, date)
- [ ] Pagination des avis sur page prestataire
- [ ] Photos/vidéos dans les avis
- [ ] Avis "utile" (like/dislike)
- [ ] Notification email au prestataire
- [ ] Badge "Top noté" pour prestataires 4.5+

## 📝 Notes techniques

### Architecture
- **Module**: `backend/src/avis/`
  - `avis.controller.ts` - Routes HTTP
  - `avis.service.ts` - Logique métier
  - `avis.module.ts` - Configuration NestJS
  - `dto/create-avis.dto.ts` - Validation

- **Frontend**: 
  - `components/AvisModal.tsx` - Modal réutilisable
  - `app/(private)/client/dashboard/page.tsx` - Intégration
  - `app/(public)/prestataires/[id]/page.tsx` - Affichage

### Dépendances
- Backend: `class-validator`, `class-transformer`
- Frontend: `dynamic import` pour SSR-safe

---

✅ **Système d'avis entièrement fonctionnel et déployé !**

