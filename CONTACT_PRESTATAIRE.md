# 📞 Contact Prestataire & Avis Automatique - VBS

## ✅ Fonctionnalité implémentée

### 🎯 Concept
Lorsqu'un client clique sur le bouton **"Contacter"** d'un prestataire, le système crée automatiquement une **commande terminée** qui permet au client de laisser un avis immédiatement.

### 🔄 Workflow complet

```
1. Client consulte le profil d'un prestataire
   ↓
2. Click sur le bouton "📞 Contacter"
   ↓
3. Système vérifie l'authentification
   ↓
4. Création automatique:
   - Demande de service (ACCEPTEE)
   - Commande (TERMINEE, prix=0)
   ↓
5. Redirection vers /client/dashboard
   ↓
6. Commande apparaît dans "Commandes à évaluer"
   ↓
7. Client peut laisser un avis immédiatement
```

## 🔧 Backend - API

### Endpoint: Création automatique de commande
```
POST /api/commandes/auto-create
```

**Authentification**: Requise (JWT)  
**Rôle requis**: CLIENT (USER)

**Body**:
```json
{
  "demandeId": "uuid",
  "prestataireId": "uuid"
}
```

**Logique**:
1. ✅ Vérifie que la demande existe et appartient à l'utilisateur
2. ✅ Vérifie qu'il n'existe pas déjà une commande pour cette demande/prestataire
3. ✅ Met à jour le statut de la demande à `ACCEPTEE`
4. ✅ Crée une commande avec:
   - `statut: TERMINEE` (pour permettre l'avis immédiatement)
   - `prix: 0` (contact gratuit)
5. ✅ Retourne la commande créée ou existante

**Validations**:
- ✅ Demande doit exister
- ✅ Demande doit appartenir à l'utilisateur
- ✅ Si commande existe déjà → retour de la commande existante (idempotence)

## 🎨 Frontend - Interface

### 1. Page Détail Prestataire (`/prestataires/[id]`)

**Bouton "Contacter"**:
```tsx
<Button 
  className="w-full" 
  onClick={handleContact}
  disabled={contacting}
>
  {contacting ? 'Contact en cours...' : '📞 Contacter'}
</Button>
```

**Fonctionnalités**:
- ✅ Vérification de l'authentification (redirect vers `/login` si non connecté)
- ✅ Vérification du rôle (seulement les clients)
- ✅ Création automatique demande + commande
- ✅ Redirection vers le dashboard client
- ✅ Message de confirmation
- ✅ État de chargement pendant la création
- ✅ Gestion des erreurs

**Message informatif**:
```
"En cliquant sur Contacter, vous pourrez laisser un avis"
```

### 2. Fonction `handleContact`

```typescript
const handleContact = async () => {
  // 1. Vérification authentification
  if (!isAuthenticated()) {
    router.push('/login');
    return;
  }

  // 2. Vérification rôle CLIENT
  if (user?.role !== 'USER') {
    alert('Seuls les clients peuvent contacter des prestataires');
    return;
  }

  // 3. Création demande
  const demandeRes = await api.post('/demandes', {
    serviceId: firstService.id,
    description: `Contact depuis le profil du prestataire ${prestataire.raisonSociale}`,
  });

  // 4. Création commande automatique
  await api.post('/commandes/auto-create', {
    demandeId: demandeRes.data.id,
    prestataireId: prestataire.id,
  });

  // 5. Redirection
  router.push('/client/dashboard');
  alert('Vous pouvez maintenant laisser un avis sur ce prestataire !');
};
```

### 3. Dashboard Client

**Section automatique "Commandes à évaluer"**:
- ✅ Affiche toutes les commandes `TERMINEE` sans avis
- ✅ Inclut les commandes créées via "Contacter"
- ✅ Bouton "⭐ Laisser un avis" pour chaque commande

## 📊 Données créées

### Demande
```javascript
{
  serviceId: "premier-service-du-prestataire",
  description: "Contact depuis le profil du prestataire [Nom]",
  statut: "ACCEPTEE",
  utilisateurId: "id-du-client"
}
```

### Commande
```javascript
{
  demandeId: "uuid-de-la-demande",
  prestataireId: "uuid-du-prestataire",
  utilisateurId: "id-du-client",
  statut: "TERMINEE",  // ← Permet l'avis immédiat
  prix: 0              // ← Contact gratuit
}
```

## 🔒 Sécurité & Validations

### Backend
- ✅ Authentification JWT obligatoire
- ✅ Guard de rôle: CLIENT uniquement
- ✅ Vérification de propriété de la demande
- ✅ Prévention des doublons (idempotence)

### Frontend
- ✅ Vérification authentification avant action
- ✅ Vérification rôle côté client
- ✅ État de chargement (prévention double-click)
- ✅ Gestion des erreurs avec messages utilisateur
- ✅ Redirection automatique après succès

## ✨ Avantages de cette approche

### Pour le client
- ✅ **Simplicité**: Un seul clic pour contacter
- ✅ **Feedback immédiat**: Peut laisser un avis directement
- ✅ **Pas de friction**: Pas besoin d'attendre la fin d'un service
- ✅ **Traçabilité**: Historique de tous les contacts

### Pour le prestataire
- ✅ **Plus d'avis**: Augmente le nombre d'évaluations
- ✅ **Visibilité**: Améliore la réputation
- ✅ **Contacts qualifiés**: Trace des clients intéressés
- ✅ **Statistiques**: Nombre de contacts reçus

### Pour la plateforme
- ✅ **Engagement**: Encourage l'interaction
- ✅ **Contenu**: Génère plus d'avis
- ✅ **Données**: Analytics sur les contacts
- ✅ **Confiance**: Système transparent

## 🎯 Cas d'usage

### Scénario 1: Premier contact
```
1. Client recherche "Électricien Dakar"
2. Trouve "SEN Électricité Services"
3. Consulte le profil
4. Click "Contacter"
5. → Créé automatiquement
6. Peut laisser un avis immédiatement
```

### Scénario 2: Contact depuis la recherche
```
1. Client voit les résultats sur la carte
2. Click sur une carte prestataire
3. Consulte les services
4. Click "Contacter"
5. → Dashboard avec section "À évaluer"
6. Laisse un avis 5 étoiles
```

### Scénario 3: Contact multiple
```
1. Client contacte Prestataire A
2. Plus tard, contacte Prestataire B
3. Dashboard affiche les 2 commandes
4. Peut évaluer chacun séparément
```

## 🧪 Tests

### Test manuel

1. **Connexion client**:
   ```
   Téléphone: +221770001000
   OTP: 123456
   ```

2. **Accéder à un prestataire**:
   ```
   http://localhost:3000/prestataires/[id]
   ```

3. **Cliquer sur "Contacter"**:
   - ✅ Vérifier redirection vers dashboard
   - ✅ Vérifier présence dans "Commandes à évaluer"
   - ✅ Vérifier bouton "Laisser un avis" actif

4. **Laisser un avis**:
   - ✅ Sélectionner note
   - ✅ Écrire commentaire
   - ✅ Soumettre
   - ✅ Vérifier disparition de "À évaluer"

### Vérifications API

```bash
# 1. Créer une demande
POST http://localhost:4000/api/demandes
{
  "serviceId": "uuid",
  "description": "Test contact"
}

# 2. Créer commande automatique
POST http://localhost:4000/api/commandes/auto-create
{
  "demandeId": "uuid-de-la-demande",
  "prestataireId": "uuid-du-prestataire"
}

# 3. Vérifier la commande
GET http://localhost:4000/api/commandes/mes-commandes
# → Doit retourner la commande avec statut TERMINEE
```

## 🚀 Améliorations futures possibles

- [ ] Ajout d'un historique des contacts
- [ ] Notification au prestataire lors d'un contact
- [ ] Timer avant de pouvoir laisser un avis (optionnel)
- [ ] Badge "Client vérifié" après X contacts
- [ ] Analytics des taux de conversion contact → avis
- [ ] Possibilité de "favoris" sans contact immédiat
- [ ] Chat intégré après contact
- [ ] Rappel email pour laisser un avis

## 📝 Notes techniques

### Architecture
- **Controller**: `backend/src/commandes/commandes.controller.ts`
- **Service**: `backend/src/commandes/commandes.service.ts`
- **Frontend**: `frontend/app/(public)/prestataires/[id]/page.tsx`

### État de la commande
- `TERMINEE` est utilisé pour permettre l'avis immédiat
- `prix: 0` indique un contact gratuit (pas de transaction réelle)
- La commande reste dans l'historique pour traçabilité

### Idempotence
Si le client clique plusieurs fois sur "Contacter":
- La même commande est retournée (pas de doublon)
- Grâce à la vérification `findFirst` dans `autoCreateCommande`

---

✅ **Fonctionnalité "Contact → Avis" entièrement opérationnelle !**

