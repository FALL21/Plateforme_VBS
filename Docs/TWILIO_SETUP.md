# Configuration Twilio pour l'envoi de SMS OTP

## 📋 Prérequis

1. Créer un compte sur [Twilio](https://www.twilio.com/)
2. Obtenir un numéro de téléphone Twilio (gratuit pour les tests)
3. Récupérer vos identifiants depuis le [Console Twilio](https://www.twilio.com/console)

## 🔑 Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Twilio SMS (pour l'envoi de codes OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Où trouver ces valeurs ?

1. **TWILIO_ACCOUNT_SID** : 
   - Connectez-vous au [Console Twilio](https://www.twilio.com/console)
   - L'Account SID est visible sur le dashboard principal
   - Format : `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **TWILIO_AUTH_TOKEN** :
   - Même page que l'Account SID
   - Cliquez sur "Show" pour révéler le token
   - ⚠️ **Important** : Gardez ce token secret !

3. **TWILIO_PHONE_NUMBER** :
   - Allez dans [Phone Numbers > Manage > Active numbers](https://www.twilio.com/console/phone-numbers/incoming)
   - Si vous n'avez pas de numéro, [en obtenez un gratuitement](https://www.twilio.com/console/phone-numbers/search)
   - Format : `+1234567890` (avec le préfixe + et l'indicatif pays)

## 🧪 Mode Développement

Si Twilio n'est **pas configuré** (variables manquantes), le système :
- ✅ Génère toujours un code OTP valide
- ✅ Log le code dans la console pour faciliter les tests
- ✅ Utilise le code `123456` en développement pour simplifier les tests
- ⚠️ **Ne bloque pas** le processus d'authentification

### Exemple de log en développement :

```
⚠️ Twilio non configuré. Variables manquantes: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
📝 Les codes OTP seront loggés dans la console en mode développement
📱 [DEV] SMS OTP pour +221771234567: 123456
```

## 🚀 Mode Production

En production, avec Twilio configuré :
- ✅ Les codes OTP sont envoyés par SMS réels
- ✅ Les codes sont générés aléatoirement (6 chiffres)
- ✅ Le code n'est **jamais** retourné dans la réponse API
- ✅ Les erreurs d'envoi sont loggées mais n'empêchent pas la génération du code

### Exemple de log en production :

```
✅ Service SMS Twilio initialisé avec succès
✅ SMS OTP envoyé à +221771234567 (SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
```

## 📱 Format des Numéros

Le service normalise automatiquement les numéros au format E.164 :

- `771234567` → `+221771234567` (Sénégal)
- `00221771234567` → `+221771234567`
- `+221771234567` → `+221771234567` (déjà correct)

## 🔒 Sécurité

- ⚠️ Ne commitez **jamais** votre fichier `.env` avec les vraies clés Twilio
- ✅ Utilisez des variables d'environnement sécurisées en production
- ✅ Le code OTP expire après 10 minutes
- ✅ Le code OTP est supprimé après utilisation

## 🐛 Dépannage

### Erreur : "Invalid phone number"
- Vérifiez que le numéro est au format E.164 (`+221771234567`)
- Assurez-vous que le numéro Twilio est valide et activé

### Erreur : "Authentication failed"
- Vérifiez que `TWILIO_ACCOUNT_SID` et `TWILIO_AUTH_TOKEN` sont corrects
- Vérifiez qu'il n'y a pas d'espaces dans les valeurs

### SMS non reçus
- Vérifiez les logs du serveur pour les erreurs Twilio
- Vérifiez que votre compte Twilio a des crédits
- En mode test, Twilio n'envoie des SMS qu'aux numéros vérifiés

## 📚 Ressources

- [Documentation Twilio Node.js](https://www.twilio.com/docs/libraries/node)
- [Console Twilio](https://www.twilio.com/console)
- [Obtenir un numéro Twilio gratuit](https://www.twilio.com/console/phone-numbers/search)
