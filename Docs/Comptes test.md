
## 🔑 Code OTP par défaut : **`123456`**

### Comment l'utiliser :

1. **Page de connexion** : Entrez un numéro de téléphone (ex: `+221770001000` pour le client)
2. **Code OTP** : Entrez `123456`
3. **Connexion réussie** !

### 📋 Comptes de test disponibles :

| Type                            | Téléphone       | Code OTP |
| ------------------------------- | --------------- | -------- |
| 👤 **Client**                   | `+221770001000` | `123456` |
| 👑 **Admin**                    | `+221770009999` | `123456` |
| 🏢 **Prestataire (Vente)**      | `+221770000100` | `123456` |
| 🏢 **Prestataire (Services)**   | `+221770000102` | `123456` |
| 🏢 **Prestataire (Immobilier)** | `+221770000104` | `123456` |
| ...                             | ...             | `123456` |

### ⚠️ Important :
- Le code `123456` fonctionne **uniquement en mode développement** (`NODE_ENV=development`)
- En production, un code aléatoire sera généré et envoyé par SMS/Email
- Le code expire après **10 minutes**
