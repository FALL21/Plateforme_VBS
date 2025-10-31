# 🚀 Plan d'Implémentations à Faire - VBS Platform PWA

> **Analyse Expert PWA - Document Technique Complet**  
> Date: 31 Octobre 2025  
> Statut: En développement (MVP Phase)

---

## 📊 État Actuel du Projet

### ✅ **Ce qui est fonctionnel (80% Backend, 60% Frontend)**

#### Backend (NestJS + Prisma + PostgreSQL)

- ✅ Architecture modulaire complète (11 modules)
- ✅ Authentification OTP + JWT
- ✅ CRUD Utilisateurs avec gestion des rôles (USER, PRESTATAIRE, ADMIN)
- ✅ Système de recherche géolocalisée
- ✅ Gestion des secteurs/sous-secteurs/services
- ✅ Système d'abonnements prestataires
- ✅ Paiements (Wave, Orange Money, Espèces)
- ✅ Système de demandes et commandes
- ✅ Système d'avis et notation
- ✅ Dashboard admin avec KPIs
- ✅ Validation KYC
- ✅ Gestion des comptes actifs/désactivés
- ✅ Filtrage des prestataires par statut actif
- ✅ Normalisation automatique des numéros de téléphone

#### Frontend (Next.js 14 + React)

- ✅ Structure App Router
- ✅ Composants UI (shadcn/ui) : Button, Card, Input, Select
- ✅ Composants métier : MapView (Leaflet), RatingStars, Header
- ✅ Pages principales :
  - Page d'accueil
  - Authentification OTP
  - Recherche avancée avec carte
  - Fiche prestataire détaillée
  - Dashboard client
  - Dashboard prestataire
  - Dashboard admin
  - Gestion utilisateurs (admin)
  - Gestion secteurs (admin)
- ✅ Store Zustand avec persistance
- ✅ Axios avec intercepteurs JWT
- ✅ Gestion des sessions

### ❌ **Ce qui manque (Fonctionnalités critiques PWA)**

---

## 🎯 **PRIORITÉ ABSOLUE - PWA CORE**

### 1. 📱 Configuration PWA Complète [CRITIQUE]

#### 1.1 Manifest.json

**Fichier:** `frontend/public/manifest.json`

```json
{
  "name": "VBS - Vos Besoins Services",
  "short_name": "VBS",
  "description": "Plateforme de mise en relation avec des prestataires de services au Sénégal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "lifestyle", "productivity"],
  "shortcuts": [
    {
      "name": "Rechercher un service",
      "short_name": "Recherche",
      "description": "Trouver un prestataire rapidement",
      "url": "/recherche",
      "icons": [
        {
          "src": "/icons/shortcut-search.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Mes commandes",
      "short_name": "Commandes",
      "description": "Voir mes commandes en cours",
      "url": "/client/dashboard",
      "icons": [
        {
          "src": "/icons/shortcut-orders.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/search.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

**Actions:**

- [ ] Créer le fichier manifest.json
- [ ] Générer tous les icônes (72x72 à 512x512) avec fond maskable
- [ ] Ajouter les screenshots pour le Google Play Store
- [ ] Lier le manifest dans `app/layout.tsx`

---

#### 1.2 Service Worker avec Workbox

**Fichier:** `frontend/public/sw.js`

**Installation nécessaire:**

```bash
npm install --save-dev workbox-webpack-plugin workbox-window
npm install next-pwa
```

**Configuration:** `frontend/next.config.js`

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "mapbox-tiles",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https?:\/\/localhost:4000\/api\/(secteurs|services).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-static-data",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https?:\/\/localhost:4000\/api\/prestataires.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-prestataires",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 6 * 60 * 60, // 6 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
});
```

**Actions:**

- [ ] Installer next-pwa et workbox
- [ ] Configurer next.config.js
- [ ] Créer stratégies de cache personnalisées
- [ ] Tester offline mode
- [ ] Implémenter sync en arrière-plan

---

#### 1.3 Meta Tags et SEO

**Fichier:** `frontend/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://vbs.sn"),
  title: {
    default: "VBS - Vos Besoins Services",
    template: "%s | VBS",
  },
  description:
    "Trouvez les meilleurs prestataires de services au Sénégal. Ménage, plomberie, électricité, et plus encore.",
  keywords: [
    "prestataires",
    "services",
    "sénégal",
    "dakar",
    "ménage",
    "plomberie",
    "électricité",
  ],
  authors: [{ name: "VBS Team" }],
  creator: "VBS",
  publisher: "VBS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VBS",
  },
  applicationName: "VBS - Vos Besoins Services",
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: "https://vbs.sn",
    siteName: "VBS",
    title: "VBS - Vos Besoins Services",
    description: "Trouvez les meilleurs prestataires de services au Sénégal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VBS - Vos Besoins Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VBS - Vos Besoins Services",
    description: "Trouvez les meilleurs prestataires de services au Sénégal",
    images: ["/twitter-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};
```

**Actions:**

- [ ] Ajouter les meta tags complets
- [ ] Créer les images OG (Open Graph)
- [ ] Générer les favicons (32x32, 192x192, apple-touch-icon)
- [ ] Ajouter structured data (JSON-LD)
- [ ] Configurer robots.txt et sitemap.xml

---

### 2. 📡 Notifications Push Web [HAUTE PRIORITÉ]

#### 2.1 Configuration Firebase Cloud Messaging (FCM)

**Fichier:** `frontend/lib/firebase.ts`

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Ce navigateur ne supporte pas les notifications");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted" && messaging) {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  }
  return null;
}

export function onMessageListener() {
  return new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });
}
```

**Fichier:** `frontend/public/firebase-messaging-sw.js`

```javascript
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

#### 2.2 Backend - API Notifications

**Fichier:** `backend/src/notifications/notifications.service.ts`

```typescript
import * as admin from "firebase-admin";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  async sendNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, notificationsEnabled: true },
    });

    if (!user?.fcmToken || !user.notificationsEnabled) {
      return {
        success: false,
        reason: "No FCM token or notifications disabled",
      };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        token: user.fcmToken,
      };

      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false, error };
    }
  }

  async sendToMultiple(userIds: string[], notification: any) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        notificationsEnabled: true,
        fcmToken: { not: null },
      },
      select: { fcmToken: true },
    });

    const tokens = users.map((u) => u.fcmToken).filter(Boolean);

    if (tokens.length === 0) return { success: false };

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    return { success: true, response };
  }
}
```

**Actions:**

- [ ] Créer projet Firebase
- [ ] Configurer FCM dans Firebase Console
- [ ] Implémenter requestNotificationPermission() dans le frontend
- [ ] Créer le service backend pour envoyer les notifications
- [ ] Ajouter champ `fcmToken` et `notificationsEnabled` au model User
- [ ] Implémenter notifications pour :
  - Nouvelle demande (prestataire)
  - Demande acceptée (client)
  - Commande terminée (client)
  - KYC validé (prestataire)
  - Abonnement expirant (prestataire)

---

### 3. 💾 IndexedDB pour Stockage Offline [HAUTE PRIORITÉ]

#### 3.1 Configuration Dexie.js (Wrapper IndexedDB)

**Installation:**

```bash
npm install dexie dexie-react-hooks
```

**Fichier:** `frontend/lib/db.ts`

```typescript
import Dexie, { Table } from "dexie";

export interface CachedPrestataire {
  id: string;
  raisonSociale: string;
  description?: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  noteMoyenne: number;
  nombreAvis: number;
  services: any[];
  timestamp: number;
}

export interface CachedSecteur {
  id: string;
  nom: string;
  slug: string;
  sousSecteurs: any[];
  timestamp: number;
}

export interface CachedRecherche {
  id: string;
  query: string;
  filters: any;
  results: any[];
  timestamp: number;
}

export interface OfflineAction {
  id?: number;
  type: "create_demande" | "create_avis" | "update_profile";
  payload: any;
  timestamp: number;
  synced: boolean;
}

export class VBSDatabase extends Dexie {
  prestataires!: Table<CachedPrestataire, string>;
  secteurs!: Table<CachedSecteur, string>;
  recherches!: Table<CachedRecherche, string>;
  offlineActions!: Table<OfflineAction, number>;

  constructor() {
    super("VBSDatabase");

    this.version(1).stores({
      prestataires: "id, raisonSociale, timestamp",
      secteurs: "id, slug, timestamp",
      recherches: "id, timestamp",
      offlineActions: "++id, type, timestamp, synced",
    });
  }
}

export const db = new VBSDatabase();

// Utilities
export async function cachePrestataire(prestataire: CachedPrestataire) {
  await db.prestataires.put({
    ...prestataire,
    timestamp: Date.now(),
  });
}

export async function getCachedPrestataire(id: string) {
  return await db.prestataires.get(id);
}

export async function clearOldCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  await db.prestataires
    .where("timestamp")
    .below(now - maxAgeMs)
    .delete();
  await db.recherches
    .where("timestamp")
    .below(now - maxAgeMs)
    .delete();
}

export async function addOfflineAction(
  action: Omit<OfflineAction, "id" | "timestamp" | "synced">
) {
  await db.offlineActions.add({
    ...action,
    timestamp: Date.now(),
    synced: false,
  });
}

export async function getPendingActions() {
  return await db.offlineActions.where("synced").equals(false).toArray();
}

export async function markActionSynced(id: number) {
  await db.offlineActions.update(id, { synced: true });
}
```

#### 3.2 Hook React pour Sync Offline

**Fichier:** `frontend/hooks/useOfflineSync.ts`

```typescript
import { useEffect, useState } from "react";
import { db, getPendingActions, markActionSynced } from "@/lib/db";
import api from "@/lib/api";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Vérifier les actions en attente au chargement
    getPendingActions().then((actions) => {
      setPendingCount(actions.length);
    });

    // Synchroniser quand la connexion revient
    const handleOnline = async () => {
      setIsSyncing(true);
      const actions = await getPendingActions();

      for (const action of actions) {
        try {
          switch (action.type) {
            case "create_demande":
              await api.post("/demandes", action.payload);
              break;
            case "create_avis":
              await api.post("/avis", action.payload);
              break;
            case "update_profile":
              await api.patch("/users/me", action.payload);
              break;
          }

          await markActionSynced(action.id!);
          setPendingCount((prev) => prev - 1);
        } catch (error) {
          console.error("Erreur sync:", error);
        }
      }

      setIsSyncing(false);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { isSyncing, pendingCount };
}
```

**Actions:**

- [ ] Installer Dexie.js
- [ ] Créer le schema IndexedDB
- [ ] Implémenter le cache des prestataires
- [ ] Implémenter le cache des secteurs/services
- [ ] Créer le système de queue pour actions offline
- [ ] Implémenter la synchronisation automatique
- [ ] Ajouter indicateur UI pour mode offline

---

### 4. 🔄 Background Sync API [MOYENNE PRIORITÉ]

**Fichier:** `frontend/lib/background-sync.ts`

```typescript
export async function registerBackgroundSync(tag: string, payload: any) {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Stocker les données à synchroniser
      await db.offlineActions.add({
        type: tag as any,
        payload,
        timestamp: Date.now(),
        synced: false,
      });

      // Enregistrer la tâche de sync
      await registration.sync.register(tag);

      return { success: true };
    } catch (error) {
      console.error("Background Sync registration failed:", error);
      return { success: false, error };
    }
  }

  return { success: false, reason: "Background Sync not supported" };
}
```

**Dans Service Worker:** `frontend/public/sw.js`

```javascript
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  // Récupérer les actions en attente depuis IndexedDB
  // Envoyer au serveur
  // Marquer comme synchronisées
}
```

**Actions:**

- [ ] Implémenter Background Sync dans le Service Worker
- [ ] Créer les handlers pour différents types de sync
- [ ] Tester avec déconnexion réseau

---

### 5. 📲 Installation Prompt et A2HS [HAUTE PRIORITÉ]

**Fichier:** `frontend/components/InstallPrompt.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Ne pas afficher si déjà refusé récemment
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const daysSince =
        (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // Attendre 7 jours
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Afficher après 30 secondes de navigation
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("App installée");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <img
          src="/icons/icon-72x72.png"
          alt="VBS"
          className="w-12 h-12 rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Installer VBS</h3>
          <p className="text-sm text-gray-600 mb-3">
            Installez l'application pour un accès rapide et utilisez-la hors
            ligne
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm">
              Installer
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Actions:**

- [ ] Créer le composant InstallPrompt
- [ ] Ajouter dans le layout principal
- [ ] Implémenter la logique de timing (après 30s)
- [ ] Gérer le localStorage pour ne pas spam
- [ ] Ajouter analytics pour tracking installations

---

## 🎨 **PRIORITÉ 2 - UX/UI Améliorations**

### 6. 🎭 Composants UI Manquants

#### 6.1 Composants shadcn/ui à ajouter

```bash
# Toast notifications
npx shadcn-ui@latest add toast

# Dialog/Modal
npx shadcn-ui@latest add dialog

# Dropdown Menu
npx shadcn-ui@latest add dropdown-menu

# Tabs
npx shadcn-ui@latest add tabs

# Badge
npx shadcn-ui@latest add badge

# Avatar
npx shadcn-ui@latest add avatar

# Skeleton (loading)
npx shadcn-ui@latest add skeleton

# Progress
npx shadcn-ui@latest add progress

# Alert
npx shadcn-ui@latest add alert

# Sheet (drawer mobile)
npx shadcn-ui@latest add sheet

# Pagination
npx shadcn-ui@latest add pagination
```

#### 6.2 Composants Métier à Créer

**Liste des composants prioritaires:**

1. **LoadingSpinner.tsx** - Indicateur de chargement global
2. **OfflineIndicator.tsx** - Bannière "Vous êtes hors ligne"
3. **NetworkStatus.tsx** - Indicateur qualité réseau
4. **ErrorBoundary.tsx** - Gestion des erreurs React
5. **BottomNav.tsx** - Navigation mobile (sticky bottom)
6. **PullToRefresh.tsx** - Swipe pour rafraîchir
7. **InfiniteScroll.tsx** - Chargement infini des listes
8. **SearchAutocomplete.tsx** - Autocomplétion recherche
9. **ImageOptimized.tsx** - Composant image avec lazy loading
10. **ShareButton.tsx** - Bouton partage natif
11. **LocationPicker.tsx** - Sélecteur de localisation sur carte
12. **PriceFormatter.tsx** - Affichage prix FCFA
13. **DateRelative.tsx** - Dates relatives (il y a 2h, etc.)
14. **PhoneFormatter.tsx** - Formatage numéros sénégalais

**Actions:**

- [ ] Installer tous les composants shadcn/ui manquants
- [ ] Créer tous les composants métier listés
- [ ] Documenter chaque composant (Storybook optionnel)

---

### 7. 📱 Mobile First & Responsive

#### 7.1 Breakpoints Tailwind personnalisés

**Fichier:** `frontend/tailwind.config.ts`

```typescript
theme: {
  screens: {
    'xs': '375px',    // Mobile small
    'sm': '640px',    // Mobile large
    'md': '768px',    // Tablet
    'lg': '1024px',   // Desktop
    'xl': '1280px',   // Desktop large
    '2xl': '1536px',  // Desktop XL
  },
  extend: {
    spacing: {
      'safe-top': 'env(safe-area-inset-top)',
      'safe-bottom': 'env(safe-area-inset-bottom)',
      'safe-left': 'env(safe-area-inset-left)',
      'safe-right': 'env(safe-area-inset-right)',
    },
  },
}
```

#### 7.2 Gestion des Safe Areas (iOS)

**Fichier:** `frontend/app/globals.css`

```css
@supports (padding: env(safe-area-inset-top)) {
  .safe-area-padding {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
```

#### 7.3 Touch Gestures

```bash
npm install react-use-gesture
```

**Exemple Pull-to-Refresh:**

```tsx
import { useGesture } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";

export function PullToRefresh({ onRefresh, children }) {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useGesture({
    onDrag: ({ down, movement: [, my] }) => {
      if (my > 0 && window.scrollY === 0) {
        api.start({ y: down ? my : 0, immediate: down });
        if (!down && my > 80) {
          onRefresh();
        }
      }
    },
  });

  return (
    <animated.div {...bind()} style={{ y }}>
      {children}
    </animated.div>
  );
}
```

**Actions:**

- [ ] Configurer les safe areas
- [ ] Implémenter les gestures (swipe, pull-to-refresh)
- [ ] Tester sur iOS Safari et Android Chrome
- [ ] Optimiser les touch targets (min 44x44px)

---

## 🔐 **PRIORITÉ 3 - Sécurité & Performance**

### 8. 🛡️ Sécurité Renforcée

#### 8.1 Content Security Policy (CSP)

**Fichier:** `frontend/next.config.js`

```javascript
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.vbs.sn wss:;
      frame-src 'self';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];

module.exports = withPWA({
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
});
```

#### 8.2 Rate Limiting Frontend

**Fichier:** `frontend/lib/rate-limiter.ts`

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Supprimer les requêtes hors fenêtre
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Usage
if (!rateLimiter.canMakeRequest("search", 10, 60000)) {
  throw new Error("Trop de requêtes. Réessayez dans 1 minute.");
}
```

#### 8.3 Sanitization des Inputs

```bash
npm install dompurify
npm install @types/dompurify --save-dev
```

**Fichier:** `frontend/lib/sanitize.ts`

```typescript
import DOMPurify from "dompurify";

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/<script.*?>.*?<\/script>/gi, "");
}
```

**Actions:**

- [ ] Configurer CSP headers
- [ ] Implémenter rate limiting frontend
- [ ] Ajouter sanitization sur tous les inputs utilisateur
- [ ] Implémenter CSRF protection
- [ ] Ajouter validation côté client avec Zod

---

### 9. ⚡ Optimisations Performance

#### 9.1 Image Optimization

**Fichier:** `frontend/components/ImageOptimized.tsx`

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function ImageOptimized({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
}: Props) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={85}
        onLoadingComplete={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}
```

#### 9.2 Code Splitting & Lazy Loading

**Exemple dans les pages:**

```tsx
import dynamic from "next/dynamic";

// Charger la carte seulement quand nécessaire
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div>Chargement de la carte...</div>,
});

// Charger les composants lourds
const AdminDashboard = dynamic(() => import("@/components/AdminDashboard"), {
  loading: () => <Skeleton className="w-full h-96" />,
});
```

#### 9.3 React Query pour Cache Serveur

```bash
npm install @tanstack/react-query
```

**Configuration:** `frontend/providers/query-provider.tsx`

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Hooks personnalisés:**

```typescript
// frontend/hooks/usePrestataires.ts
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePrestataires(filters?: any) {
  return useQuery({
    queryKey: ["prestataires", filters],
    queryFn: async () => {
      const response = await api.get("/prestataires", { params: filters });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePrestataire(id: string) {
  return useQuery({
    queryKey: ["prestataire", id],
    queryFn: async () => {
      const response = await api.get(`/prestataires/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
```

**Actions:**

- [ ] Installer React Query
- [ ] Créer tous les hooks de data fetching
- [ ] Implémenter optimistic updates
- [ ] Configurer la persistance du cache

#### 9.4 Web Vitals Monitoring

```bash
npm install web-vitals
```

**Fichier:** `frontend/lib/web-vitals.ts`

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // Envoyer à votre service d'analytics
  console.log(metric);

  // Exemple: Google Analytics
  if (window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

**Dans app/layout.tsx:**

```tsx
"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/web-vitals";

export default function Layout({ children }) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return children;
}
```

**Actions:**

- [ ] Installer web-vitals
- [ ] Configurer le monitoring
- [ ] Intégrer avec Google Analytics ou autre
- [ ] Créer dashboard de métriques

---

## 📊 **PRIORITÉ 4 - Analytics & Monitoring**

### 10. 📈 Google Analytics 4 + Tag Manager

**Fichier:** `frontend/lib/gtag.ts`

```typescript
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Events personnalisés
export const trackSearch = (query: string, filters: any) => {
  event({
    action: "search",
    category: "engagement",
    label: query,
  });
};

export const trackPrestataireView = (prestataireId: string) => {
  event({
    action: "view_prestataire",
    category: "engagement",
    label: prestataireId,
  });
};

export const trackContactClick = (prestataireId: string) => {
  event({
    action: "contact_prestataire",
    category: "conversion",
    label: prestataireId,
  });
};
```

**Intégration dans app/layout.tsx:**

```tsx
import Script from "next/script";
import { GA_TRACKING_ID } from "@/lib/gtag";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Actions:**

- [ ] Créer compte Google Analytics 4
- [ ] Configurer Google Tag Manager
- [ ] Implémenter tous les events de tracking
- [ ] Créer dashboard de KPIs dans GA4

---

### 11. 🐛 Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

**Configuration:** `sentry.client.config.js`

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**Actions:**

- [ ] Créer compte Sentry
- [ ] Configurer Sentry pour frontend et backend
- [ ] Implémenter custom error boundaries
- [ ] Configurer les alertes

---

## 🚀 **PRIORITÉ 5 - Features Business Critiques**

### 12. 💳 Intégrations Paiement Complètes

#### 12.1 Wave Money API

**Backend:** `backend/src/paiements/providers/wave.service.ts`

```typescript
import axios from "axios";

@Injectable()
export class WaveService {
  private readonly apiUrl = process.env.WAVE_API_URL;
  private readonly apiKey = process.env.WAVE_API_KEY;
  private readonly webhookSecret = process.env.WAVE_WEBHOOK_SECRET;

  async initiatePayment(amount: number, currency: string, callbackUrl: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/v1/checkout/sessions`,
        {
          amount,
          currency,
          success_url: callbackUrl + "/success",
          cancel_url: callbackUrl + "/cancel",
          metadata: {
            source: "vbs-platform",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        checkoutUrl: response.data.wave_launch_url,
        transactionId: response.data.id,
      };
    } catch (error) {
      throw new Error(`Wave payment initiation failed: ${error.message}`);
    }
  }

  async verifyWebhook(signature: string, payload: any): Promise<boolean> {
    const crypto = require("crypto");
    const computedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return signature === computedSignature;
  }

  async getTransactionStatus(transactionId: string) {
    const response = await axios.get(
      `${this.apiUrl}/v1/checkout/sessions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    return response.data;
  }
}
```

#### 12.2 Orange Money API

**Backend:** `backend/src/paiements/providers/orange-money.service.ts`

```typescript
@Injectable()
export class OrangeMoneyService {
  private readonly apiUrl = process.env.ORANGE_MONEY_API_URL;
  private readonly merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
  private accessToken: string | null = null;

  async getAccessToken() {
    const response = await axios.post(
      `${this.apiUrl}/oauth/v2/token`,
      {
        grant_type: "client_credentials",
      },
      {
        auth: {
          username: process.env.ORANGE_MONEY_CLIENT_ID,
          password: process.env.ORANGE_MONEY_CLIENT_SECRET,
        },
      }
    );

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  async initiatePayment(amount: number, phoneNumber: string, orderId: string) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const response = await axios.post(
      `${this.apiUrl}/omcoreapis/1.0.2/mp/pay`,
      {
        merchant_key: this.merchantKey,
        currency: "XOF",
        order_id: orderId,
        amount: amount,
        return_url: process.env.APP_URL + "/paiements/callback",
        cancel_url: process.env.APP_URL + "/paiements/cancel",
        notif_url: process.env.APP_URL + "/api/webhooks/orange-money",
        lang: "fr",
        reference: orderId,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      paymentUrl: response.data.payment_url,
      payToken: response.data.pay_token,
    };
  }

  async checkTransactionStatus(payToken: string) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const response = await axios.get(
      `${this.apiUrl}/omcoreapis/1.0.2/mp/paymentstatus/${payToken}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return response.data;
  }
}
```

**Actions:**

- [ ] Obtenir credentials Wave API (sandbox puis production)
- [ ] Obtenir credentials Orange Money API
- [ ] Implémenter les services backend
- [ ] Créer les webhooks endpoints
- [ ] Tester en sandbox
- [ ] Créer les composants frontend de paiement
- [ ] Implémenter la gestion des retours (success/cancel)

---

### 13. 📸 Upload d'Images (S3/CloudFlare R2)

#### 13.1 Backend Upload Service

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

**Backend:** `backend/src/upload/upload.service.ts`

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as sharp from "sharp";

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT, // CloudFlare R2 ou AWS S3
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string
  ): Promise<{ url: string; thumbnail: string }> {
    const filename = `${Date.now()}-${file.originalname}`;
    const key = `${folder}/${filename}`;

    // Optimiser l'image
    const optimized = await sharp(file.buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Créer thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload image principale
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: optimized,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );

    // Upload thumbnail
    const thumbKey = `${folder}/thumbs/${filename}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: thumbKey,
        Body: thumbnail,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );

    return {
      url: `${process.env.S3_PUBLIC_URL}/${key}`,
      thumbnail: `${process.env.S3_PUBLIC_URL}/${thumbKey}`,
    };
  }

  async getPresignedUploadUrl(filename: string, folder: string) {
    const key = `${folder}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: "image/jpeg",
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 heure
    });

    return {
      uploadUrl: url,
      fileUrl: `${process.env.S3_PUBLIC_URL}/${key}`,
    };
  }
}
```

#### 13.2 Frontend Upload Component

**Fichier:** `frontend/components/ImageUpload.tsx`

```tsx
"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import api from "@/lib/api";

interface Props {
  onUploadComplete: (url: string) => void;
  folder?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  onUploadComplete,
  folder = "general",
  maxSizeMB = 5,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La taille maximale est ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image");
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onUploadComplete(response.data.url);
    } catch (error: any) {
      setError(error.response?.data?.message || "Erreur lors de l'upload");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Upload en cours...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8" />
              <span>Cliquer pour choisir une image</span>
              <span className="text-xs">Max {maxSizeMB}MB</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

**Actions:**

- [ ] Choisir entre AWS S3 ou CloudFlare R2
- [ ] Créer bucket et configurer CORS
- [ ] Implémenter le service backend
- [ ] Créer endpoint d'upload
- [ ] Implémenter le composant frontend
- [ ] Ajouter compression d'images (sharp)
- [ ] Implémenter la génération de thumbnails

---

### 14. 🗺️ Géolocalisation Avancée

#### 14.1 Service Géolocalisation

**Frontend:** `frontend/lib/geolocation.ts`

```typescript
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export class GeolocationService {
  private watchId: number | null = null;

  async getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Géolocalisation non supportée"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(this.handleError(error));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache 1 minute
        }
      );
    });
  }

  watchPosition(callback: (coords: Coordinates) => void): void {
    if (!navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => console.error(this.handleError(error)),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private handleError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error("Permission de géolocalisation refusée");
      case error.POSITION_UNAVAILABLE:
        return new Error("Position non disponible");
      case error.TIMEOUT:
        return new Error("Timeout de géolocalisation");
      default:
        return new Error("Erreur de géolocalisation");
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const geolocation = new GeolocationService();
```

#### 14.2 Hook React pour Géolocalisation

```typescript
import { useState, useEffect } from "react";
import { geolocation, Coordinates } from "@/lib/geolocation";

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await geolocation.getCurrentPosition();
      setCoords(position);

      // Sauvegarder dans localStorage
      localStorage.setItem("lastKnownPosition", JSON.stringify(position));
    } catch (err: any) {
      setError(err.message);

      // Essayer de récupérer la dernière position connue
      const lastPosition = localStorage.getItem("lastKnownPosition");
      if (lastPosition) {
        setCoords(JSON.parse(lastPosition));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger la dernière position connue
    const lastPosition = localStorage.getItem("lastKnownPosition");
    if (lastPosition) {
      setCoords(JSON.parse(lastPosition));
    }
  }, []);

  return { coords, error, loading, requestLocation };
}
```

**Actions:**

- [ ] Créer le service de géolocalisation
- [ ] Implémenter le hook useGeolocation
- [ ] Ajouter la gestion des permissions
- [ ] Implémenter le calcul de distance
- [ ] Ajouter le reverse geocoding (coords → adresse)

---

## 🧪 **PRIORITÉ 6 - Testing & Quality**

### 15. 🧪 Tests Automatisés

#### 15.1 Setup Jest + React Testing Library

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

**Configuration:** `jest.config.js`

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

module.exports = createJestConfig(customJestConfig);
```

**Fichier:** `jest.setup.js`

```javascript
import "@testing-library/jest-dom";
```

#### 15.2 Tests Exemples

**Test Composant:**

```typescript
// components/__tests__/Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDisabled();
  });
});
```

**Test Hook:**

```typescript
// hooks/__tests__/useGeolocation.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useGeolocation } from "@/hooks/useGeolocation";

describe("useGeolocation", () => {
  beforeEach(() => {
    // Mock navigator.geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn(),
    };
    global.navigator.geolocation = mockGeolocation as any;
  });

  it("returns null coords initially", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.coords).toBeNull();
  });

  it("requests location on mount if autoRequest is true", async () => {
    const mockGetCurrentPosition = jest.fn((success) =>
      success({
        coords: {
          latitude: 14.6937,
          longitude: -17.4441,
        },
      })
    );
    global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

    const { result } = renderHook(() => useGeolocation({ autoRequest: true }));

    await waitFor(() => {
      expect(result.current.coords).toEqual({
        latitude: 14.6937,
        longitude: -17.4441,
      });
    });
  });
});
```

#### 15.3 E2E Tests avec Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Configuration:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Test E2E Exemple:**

```typescript
// e2e/search.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Recherche de prestataires", () => {
  test("affiche les résultats de recherche", async ({ page }) => {
    await page.goto("/recherche");

    // Attendre que la page soit chargée
    await expect(page.getByText("Rechercher un service")).toBeVisible();

    // Sélectionner un secteur
    await page.getByLabel("Secteur").click();
    await page.getByText("Ménage et Entretien").click();

    // Attendre les résultats
    await expect(page.getByText("prestataire")).toBeVisible();

    // Vérifier qu'il y a des résultats
    const resultCount = await page.getByRole("article").count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test("permet de filtrer par sous-secteur", async ({ page }) => {
    await page.goto("/recherche");

    await page.getByLabel("Secteur").click();
    await page.getByText("Ménage et Entretien").click();

    await page.getByLabel("Sous-secteur").click();
    await page.getByText("Ménage régulier").click();

    // Vérifier que les résultats sont filtrés
    await expect(page.getByText("Ménage régulier")).toBeVisible();
  });
});
```

**Actions:**

- [ ] Installer Jest et React Testing Library
- [ ] Écrire tests unitaires pour tous les composants UI
- [ ] Écrire tests pour tous les hooks
- [ ] Installer Playwright
- [ ] Écrire tests E2E pour les parcours critiques :
  - [ ] Recherche et consultation d'un prestataire
  - [ ] Inscription/Connexion
  - [ ] Création de demande
  - [ ] Souscription abonnement
  - [ ] Paiement
- [ ] Configurer CI/CD pour lancer les tests automatiquement

---

### 16. 🔍 Lighthouse & Performance Audits

**Script de test:** `scripts/lighthouse-audit.js`

```javascript
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const fs = require("fs");

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });

  const options = {
    logLevel: "info",
    output: "html",
    onlyCategories: [
      "performance",
      "accessibility",
      "best-practices",
      "seo",
      "pwa",
    ],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);

  // Sauvegarder le rapport
  const reportHtml = runnerResult.report;
  fs.writeFileSync("lighthouse-report.html", reportHtml);

  // Afficher les scores
  console.log("Lighthouse scores:");
  console.log(
    "Performance:",
    runnerResult.lhr.categories.performance.score * 100
  );
  console.log(
    "Accessibility:",
    runnerResult.lhr.categories.accessibility.score * 100
  );
  console.log(
    "Best Practices:",
    runnerResult.lhr.categories["best-practices"].score * 100
  );
  console.log("SEO:", runnerResult.lhr.categories.seo.score * 100);
  console.log("PWA:", runnerResult.lhr.categories.pwa.score * 100);

  await chrome.kill();
}

runLighthouse("http://localhost:3000");
```

**Actions:**

- [ ] Installer lighthouse
- [ ] Créer script d'audit automatique
- [ ] Viser scores > 90 pour toutes les catégories
- [ ] Intégrer dans CI/CD

---

## 📱 **PRIORITÉ 7 - Features PWA Avancées**

### 17. 📞 Web Share API

```typescript
// lib/share.ts
export async function shareContent(data: {
  title: string;
  text: string;
  url: string;
}) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return { success: true };
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
      }
      return { success: false, error };
    }
  }

  // Fallback: copier dans le presse-papier
  try {
    await navigator.clipboard.writeText(data.url);
    return { success: true, method: "clipboard" };
  } catch {
    return { success: false, error: "Share not supported" };
  }
}

// Composant
export function ShareButton({ prestataire }: { prestataire: any }) {
  const handleShare = async () => {
    await shareContent({
      title: prestataire.raisonSociale,
      text: `Découvrez ${prestataire.raisonSociale} sur VBS`,
      url: `${window.location.origin}/prestataires/${prestataire.id}`,
    });
  };

  return <Button onClick={handleShare}>Partager</Button>;
}
```

**Actions:**

- [ ] Implémenter Web Share API
- [ ] Ajouter boutons de partage sur les fiches prestataires
- [ ] Ajouter fallback copier dans presse-papier

---

### 18. 📞 Contact Picker API

```typescript
// Pour contact prestataire
export async function selectContact() {
  if ("contacts" in navigator && "ContactsManager" in window) {
    try {
      const contacts = await (navigator as any).contacts.select(
        ["name", "tel"],
        { multiple: false }
      );
      return contacts[0];
    } catch (error) {
      console.error("Contact selection failed:", error);
      return null;
    }
  }
  return null;
}
```

---

### 19. 📡 Background Fetch API

**Pour télécharger des PDF de factures, KYC documents, etc.**

```typescript
export async function downloadInBackground(url: string, filename: string) {
  if ("BackgroundFetchManager" in self) {
    const registration = await navigator.serviceWorker.ready;

    await registration.backgroundFetch.fetch(filename, [url], {
      title: `Téléchargement: ${filename}`,
      icons: [
        {
          sizes: "192x192",
          src: "/icons/icon-192x192.png",
          type: "image/png",
        },
      ],
      downloadTotal: 1000000, // Estimation
    });
  }
}
```

---

### 20. 🔐 Biometric Authentication (Web Authentication API)

```typescript
// lib/webauthn.ts
export async function registerBiometric(userId: string) {
  if (!window.PublicKeyCredential) {
    throw new Error("WebAuthn not supported");
  }

  // Obtenir challenge du serveur
  const challengeResponse = await api.post(
    "/auth/webauthn/register-challenge",
    {
      userId,
    }
  );

  const { challenge, user } = challengeResponse.data;

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
      rp: {
        name: "VBS",
        id: window.location.hostname,
      },
      user: {
        id: Uint8Array.from(user.id, (c) => c.charCodeAt(0)),
        name: user.email || user.phone,
        displayName: user.name || "Utilisateur VBS",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
    },
  });

  // Envoyer au serveur pour vérification
  await api.post("/auth/webauthn/register-verify", {
    credential,
  });

  return { success: true };
}

export async function loginWithBiometric() {
  const challengeResponse = await api.post("/auth/webauthn/login-challenge");
  const { challenge } = challengeResponse.data;

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
      timeout: 60000,
      userVerification: "required",
    },
  });

  const response = await api.post("/auth/webauthn/login-verify", {
    assertion,
  });

  return response.data;
}
```

**Actions:**

- [ ] Implémenter WebAuthn côté backend
- [ ] Créer l'interface de configuration biométrique
- [ ] Tester sur iOS (Face ID) et Android (empreinte digitale)

---

## 🎯 **Checklist Finale PWA**

### PWA Core Features

- [ ] Manifest.json complet avec tous les icônes
- [ ] Service Worker avec stratégies de cache
- [ ] Installation prompt (A2HS)
- [ ] Mode offline fonctionnel
- [ ] IndexedDB pour stockage local
- [ ] Background Sync pour synchronisation
- [ ] Notifications Push (FCM)

### Performance

- [ ] Score Lighthouse Performance > 90
- [ ] Score Lighthouse PWA = 100
- [ ] Temps de chargement initial < 3s
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Code splitting implémenté
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Fonts optimisées

### UX Mobile

- [ ] Touch gestures (swipe, pinch, etc.)
- [ ] Pull-to-refresh
- [ ] Bottom navigation mobile
- [ ] Safe areas gérées (iOS notch)
- [ ] Orientation portrait et paysage
- [ ] Splash screen personnalisé
- [ ] Transitions et animations fluides

### Sécurité

- [ ] HTTPS en production
- [ ] CSP headers configurés
- [ ] Input sanitization
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Authentification biométrique (optionnel)

### SEO & Analytics

- [ ] Meta tags Open Graph
- [ ] Structured Data (JSON-LD)
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Google Analytics configuré
- [ ] Error tracking (Sentry)

### Intégrations

- [ ] Wave Money API
- [ ] Orange Money API
- [ ] Upload S3/R2
- [ ] Firebase Cloud Messaging
- [ ] Google Maps/Leaflet

### Testing

- [ ] Tests unitaires > 80% coverage
- [ ] Tests E2E pour parcours critiques
- [ ] Tests cross-browser
- [ ] Tests sur devices réels (iOS, Android)

---

## 📅 **Planning de Réalisation Recommandé**

### Sprint 1 (Semaine 1-2) - PWA Core

- [ ] Manifest.json et icônes
- [ ] Service Worker avec next-pwa
- [ ] Installation prompt
- [ ] Mode offline basique
- [ ] Meta tags SEO

### Sprint 2 (Semaine 3) - Storage & Sync

- [ ] IndexedDB avec Dexie
- [ ] Background Sync
- [ ] Cache stratégies avancées
- [ ] Offline queue

### Sprint 3 (Semaine 4) - Notifications

- [ ] Firebase setup
- [ ] Push notifications frontend
- [ ] Backend notifications service
- [ ] Notifications types (demande, commande, etc.)

### Sprint 4 (Semaine 5) - Paiements

- [ ] Wave API intégration
- [ ] Orange Money API intégration
- [ ] Webhooks handlers
- [ ] UI paiement

### Sprint 5 (Semaine 6) - Upload & Media

- [ ] S3/R2 setup
- [ ] Upload service backend
- [ ] Composant upload frontend
- [ ] Image optimization

### Sprint 6 (Semaine 7) - UX Mobile

- [ ] Composants UI manquants
- [ ] Touch gestures
- [ ] Bottom nav mobile
- [ ] Pull-to-refresh

### Sprint 7 (Semaine 8) - Performance

- [ ] Code splitting
- [ ] Image optimization
- [ ] React Query
- [ ] Lighthouse audits

### Sprint 8 (Semaine 9) - Testing

- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Tests devices réels

### Sprint 9 (Semaine 10) - Polish & Deploy

- [ ] Analytics
- [ ] Error tracking
- [ ] Documentation
- [ ] Déploiement production

---

## 🎓 **Recommandations Finales**

### Architecture

✅ **Points forts:**

- Architecture modulaire propre (NestJS + Next.js)
- Séparation des concerns respectée
- TypeScript strict partout
- Docker pour l'infrastructure

⚠️ **À améliorer:**

- Ajouter React Query pour le cache serveur
- Implémenter error boundaries
- Ajouter retry logic dans les API calls
- Monitoring et observabilité

### Performance

- Implémenter le lazy loading systématiquement
- Utiliser React.memo pour les composants lourds
- Optimiser les re-renders avec useMemo/useCallback
- Implémenter virtual scrolling pour les longues listes

### Sécurité

- Audit de sécurité complet avant production
- Implémenter rate limiting strict
- Chiffrer les données sensibles
- Audit des dépendances (npm audit)

### UX

- Tests utilisateurs réels sur le terrain (Dakar)
- Optimiser pour les connexions lentes (2G/3G)
- Interface en français sénégalais si nécessaire
- Support multi-langues (Wolof potentiellement)

---

## 📞 **Support & Ressources**

### Documentation

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### Outils

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Can I Use](https://caniuse.com/)
- [Web.dev](https://web.dev/)

---

**Document créé par:** Expert PWA  
**Date:** 31 Octobre 2025  
**Version:** 1.0  
**Statut:** Ready for Implementation

---

_Ce document doit être traité comme une roadmap vivante. Ajustez les priorités selon les retours utilisateurs et les contraintes business._

---

## 📋 **Liste Complète des Tâches à Faire**

### 🎯 **PHASE 1 : PWA CORE (Priorité Absolue)**

#### Manifest & Icons

- [ ] Créer le fichier `frontend/public/manifest.json`
- [ ] Générer les icônes PWA :
  - [ ] icon-72x72.png
  - [ ] icon-96x96.png
  - [ ] icon-128x128.png
  - [ ] icon-144x144.png
  - [ ] icon-152x152.png
  - [ ] icon-192x192.png
  - [ ] icon-384x384.png
  - [ ] icon-512x512.png
  - [ ] icon-32x32.png (favicon)
  - [ ] apple-icon-180x180.png
- [ ] Créer les icônes de shortcuts (96x96)
- [ ] Créer les screenshots pour le store (540x720 et 1280x720)
- [ ] Générer le badge icon (72x72)
- [ ] Ajouter le manifest dans `app/layout.tsx`

#### Service Worker & Caching

- [ ] Installer `next-pwa` : `npm install next-pwa`
- [ ] Installer `workbox` : `npm install --save-dev workbox-webpack-plugin workbox-window`
- [ ] Configurer `next.config.js` avec withPWA
- [ ] Définir les stratégies de cache :
  - [ ] CacheFirst pour Google Fonts
  - [ ] StaleWhileRevalidate pour Mapbox tiles
  - [ ] NetworkFirst pour API secteurs/services
  - [ ] NetworkFirst pour API prestataires
  - [ ] CacheFirst pour les images
  - [ ] StaleWhileRevalidate pour JS/CSS
- [ ] Tester le mode offline
- [ ] Vérifier le fallback offline

#### Meta Tags & SEO

- [ ] Ajouter tous les meta tags dans `app/layout.tsx`
- [ ] Créer `public/og-image.png` (1200x630)
- [ ] Créer `public/twitter-image.png` (1200x630)
- [ ] Créer `public/robots.txt`
- [ ] Créer `public/sitemap.xml` (ou dynamique)
- [ ] Ajouter le code de vérification Google Search Console
- [ ] Implémenter les structured data (JSON-LD) pour :
  - [ ] Organization
  - [ ] LocalBusiness (prestataires)
  - [ ] Service
  - [ ] Review

#### Installation Prompt (A2HS)

- [ ] Créer `frontend/components/InstallPrompt.tsx`
- [ ] Implémenter la détection de `beforeinstallprompt`
- [ ] Ajouter la gestion du timing (affichage après 30s)
- [ ] Implémenter le localStorage pour ne pas spammer
- [ ] Ajouter le composant dans le layout principal
- [ ] Tester sur Chrome Android
- [ ] Tester sur Safari iOS

---

### 🔔 **PHASE 2 : NOTIFICATIONS PUSH**

#### Configuration Firebase

- [ ] Créer un projet Firebase
- [ ] Activer Cloud Messaging dans la console Firebase
- [ ] Récupérer les credentials (API Key, Project ID, etc.)
- [ ] Générer une clé VAPID
- [ ] Ajouter les variables d'environnement :
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
  - [ ] `FIREBASE_PRIVATE_KEY` (backend)
  - [ ] `FIREBASE_CLIENT_EMAIL` (backend)

#### Frontend Notifications

- [ ] Installer Firebase SDK : `npm install firebase`
- [ ] Créer `frontend/lib/firebase.ts`
- [ ] Implémenter `requestNotificationPermission()`
- [ ] Implémenter `onMessageListener()`
- [ ] Créer `frontend/public/firebase-messaging-sw.js`
- [ ] Ajouter le service worker Firebase aux scripts
- [ ] Créer un composant pour demander la permission
- [ ] Gérer l'affichage des notifications en foreground
- [ ] Gérer les clics sur les notifications

#### Backend Notifications

- [ ] Installer Firebase Admin SDK : `npm install firebase-admin`
- [ ] Créer le module `backend/src/notifications`
- [ ] Créer `notifications.service.ts`
- [ ] Implémenter `sendNotification()` pour un user
- [ ] Implémenter `sendToMultiple()` pour plusieurs users
- [ ] Ajouter le champ `fcmToken` au modèle User (Prisma)
- [ ] Ajouter le champ `notificationsEnabled` au modèle User
- [ ] Créer un endpoint pour sauvegarder le FCM token
- [ ] Implémenter les notifications pour :
  - [ ] Nouvelle demande (→ prestataire)
  - [ ] Demande acceptée (→ client)
  - [ ] Demande refusée (→ client)
  - [ ] Commande terminée (→ client)
  - [ ] Nouvel avis (→ prestataire)
  - [ ] KYC validé (→ prestataire)
  - [ ] KYC refusé (→ prestataire)
  - [ ] Abonnement expirant (→ prestataire, 7 jours avant)
  - [ ] Abonnement expiré (→ prestataire)
  - [ ] Paiement validé (→ prestataire)

---

### 💾 **PHASE 3 : STOCKAGE OFFLINE (IndexedDB)**

#### Configuration Dexie

- [ ] Installer Dexie : `npm install dexie dexie-react-hooks`
- [ ] Créer `frontend/lib/db.ts`
- [ ] Définir les interfaces TypeScript :
  - [ ] `CachedPrestataire`
  - [ ] `CachedSecteur`
  - [ ] `CachedRecherche`
  - [ ] `OfflineAction`
- [ ] Créer la classe `VBSDatabase` extends Dexie
- [ ] Définir le schéma des tables

#### Utilitaires Cache

- [ ] Implémenter `cachePrestataire()`
- [ ] Implémenter `getCachedPrestataire()`
- [ ] Implémenter `cacheSecteurs()`
- [ ] Implémenter `getCachedSecteurs()`
- [ ] Implémenter `cacheRecherche()`
- [ ] Implémenter `getCachedRecherche()`
- [ ] Implémenter `clearOldCache()` (nettoyer après 7 jours)

#### Queue Actions Offline

- [ ] Implémenter `addOfflineAction()`
- [ ] Implémenter `getPendingActions()`
- [ ] Implémenter `markActionSynced()`
- [ ] Créer `frontend/hooks/useOfflineSync.ts`
- [ ] Implémenter la synchronisation automatique au retour online
- [ ] Gérer les erreurs de synchronisation
- [ ] Ajouter un indicateur UI pour les actions en attente

#### Intégration dans l'App

- [ ] Cacher les secteurs au chargement initial
- [ ] Cacher les résultats de recherche
- [ ] Cacher les détails des prestataires visités
- [ ] Implémenter le fallback sur cache si offline
- [ ] Ajouter un bouton "Rafraîchir" manuel

---

### 🔄 **PHASE 4 : BACKGROUND SYNC**

#### Service Worker Background Sync

- [ ] Créer `frontend/lib/background-sync.ts`
- [ ] Implémenter `registerBackgroundSync()`
- [ ] Ajouter l'event listener `sync` dans le Service Worker
- [ ] Implémenter `syncOfflineActions()` dans le SW
- [ ] Tester la synchronisation en background
- [ ] Gérer les échecs de synchronisation (retry)

#### Types de Sync

- [ ] Sync pour création de demande
- [ ] Sync pour création d'avis
- [ ] Sync pour mise à jour de profil
- [ ] Sync pour upload d'images (si possible)

---

### 🎨 **PHASE 5 : COMPOSANTS UI MANQUANTS**

#### Composants shadcn/ui

- [ ] Installer Toast : `npx shadcn-ui@latest add toast`
- [ ] Installer Dialog : `npx shadcn-ui@latest add dialog`
- [ ] Installer Dropdown Menu : `npx shadcn-ui@latest add dropdown-menu`
- [ ] Installer Tabs : `npx shadcn-ui@latest add tabs`
- [ ] Installer Badge : `npx shadcn-ui@latest add badge`
- [ ] Installer Avatar : `npx shadcn-ui@latest add avatar`
- [ ] Installer Skeleton : `npx shadcn-ui@latest add skeleton`
- [ ] Installer Progress : `npx shadcn-ui@latest add progress`
- [ ] Installer Alert : `npx shadcn-ui@latest add alert`
- [ ] Installer Sheet : `npx shadcn-ui@latest add sheet`
- [ ] Installer Pagination : `npx shadcn-ui@latest add pagination`

#### Composants Métier Personnalisés

- [ ] Créer `LoadingSpinner.tsx`
- [ ] Créer `OfflineIndicator.tsx`
- [ ] Créer `NetworkStatus.tsx`
- [ ] Créer `ErrorBoundary.tsx`
- [ ] Créer `BottomNav.tsx` (navigation mobile)
- [ ] Créer `PullToRefresh.tsx`
- [ ] Créer `InfiniteScroll.tsx`
- [ ] Créer `SearchAutocomplete.tsx`
- [ ] Créer `ImageOptimized.tsx`
- [ ] Créer `ShareButton.tsx`
- [ ] Créer `LocationPicker.tsx`
- [ ] Créer `PriceFormatter.tsx`
- [ ] Créer `DateRelative.tsx`
- [ ] Créer `PhoneFormatter.tsx`

---

### 📱 **PHASE 6 : MOBILE FIRST & RESPONSIVE**

#### Configuration Tailwind

- [ ] Ajouter les breakpoints personnalisés dans `tailwind.config.ts`
- [ ] Configurer les safe areas (iOS notch)
- [ ] Ajouter les classes utilitaires pour safe areas

#### Touch Gestures

- [ ] Installer react-use-gesture : `npm install react-use-gesture`
- [ ] Installer react-spring : `npm install @react-spring/web`
- [ ] Implémenter Pull-to-Refresh
- [ ] Implémenter Swipe pour navigation
- [ ] Tester sur devices réels

#### Navigation Mobile

- [ ] Créer la bottom navigation mobile
- [ ] Rendre sticky la navigation
- [ ] Ajouter les icônes pour chaque section
- [ ] Gérer l'état actif
- [ ] Tester l'accessibilité

#### Tests Responsiveness

- [ ] Tester sur iPhone SE (375px)
- [ ] Tester sur iPhone 12/13 (390px)
- [ ] Tester sur iPhone 14 Pro Max (430px)
- [ ] Tester sur Galaxy S20 (360px)
- [ ] Tester sur iPad (768px)
- [ ] Tester sur Desktop (1280px+)

---

### 🛡️ **PHASE 7 : SÉCURITÉ**

#### Headers de Sécurité

- [ ] Configurer CSP dans `next.config.js`
- [ ] Ajouter `X-Frame-Options`
- [ ] Ajouter `X-Content-Type-Options`
- [ ] Ajouter `X-XSS-Protection`
- [ ] Ajouter `Strict-Transport-Security`
- [ ] Ajouter `Referrer-Policy`
- [ ] Ajouter `Permissions-Policy`
- [ ] Tester avec securityheaders.com

#### Rate Limiting Frontend

- [ ] Créer `frontend/lib/rate-limiter.ts`
- [ ] Implémenter la classe `RateLimiter`
- [ ] Ajouter rate limiting sur :
  - [ ] Recherche (10 req/min)
  - [ ] Création de demande (5 req/min)
  - [ ] Création d'avis (3 req/min)
  - [ ] Upload d'images (5 req/min)

#### Sanitization

- [ ] Installer DOMPurify : `npm install dompurify @types/dompurify`
- [ ] Créer `frontend/lib/sanitize.ts`
- [ ] Implémenter `sanitizeHTML()`
- [ ] Implémenter `sanitizeInput()`
- [ ] Appliquer sur tous les inputs utilisateur
- [ ] Appliquer sur le rendu de contenu riche (avis, descriptions)

#### Validation

- [ ] Ajouter Zod sur tous les formulaires
- [ ] Valider côté client avant envoi
- [ ] Afficher les erreurs de validation clairement

---

### ⚡ **PHASE 8 : OPTIMISATIONS PERFORMANCE**

#### Images

- [ ] Créer `ImageOptimized.tsx`
- [ ] Utiliser Next.js Image partout
- [ ] Configurer les domaines d'images autorisés
- [ ] Implémenter lazy loading
- [ ] Ajouter des placeholders blur
- [ ] Convertir en WebP si possible
- [ ] Optimiser les images existantes

#### Code Splitting

- [ ] Identifier les composants lourds
- [ ] Utiliser `dynamic()` pour MapView
- [ ] Utiliser `dynamic()` pour les dashboards
- [ ] Utiliser `dynamic()` pour les modals
- [ ] Analyser le bundle avec `@next/bundle-analyzer`

#### React Query

- [ ] Installer React Query : `npm install @tanstack/react-query`
- [ ] Créer `frontend/providers/query-provider.tsx`
- [ ] Configurer les options par défaut
- [ ] Créer les hooks :
  - [ ] `usePrestataires()`
  - [ ] `usePrestataire(id)`
  - [ ] `useSecteurs()`
  - [ ] `useServices()`
  - [ ] `useDemandes()`
  - [ ] `useCommandes()`
  - [ ] `useAvis()`
- [ ] Implémenter optimistic updates
- [ ] Configurer la persistance du cache

#### Web Vitals

- [ ] Installer web-vitals : `npm install web-vitals`
- [ ] Créer `frontend/lib/web-vitals.ts`
- [ ] Implémenter `reportWebVitals()`
- [ ] Intégrer avec Google Analytics
- [ ] Créer un dashboard de monitoring

#### Optimisations React

- [ ] Utiliser React.memo sur les composants lourds
- [ ] Utiliser useMemo pour les calculs coûteux
- [ ] Utiliser useCallback pour les fonctions passées en props
- [ ] Éviter les re-renders inutiles
- [ ] Implémenter virtual scrolling pour les listes longues

---

### 📊 **PHASE 9 : ANALYTICS & MONITORING**

#### Google Analytics 4

- [ ] Créer un compte GA4
- [ ] Récupérer le Tracking ID
- [ ] Créer `frontend/lib/gtag.ts`
- [ ] Ajouter les scripts GA4 dans `app/layout.tsx`
- [ ] Implémenter `pageview()`
- [ ] Implémenter `event()`
- [ ] Créer les events personnalisés :
  - [ ] `trackSearch()`
  - [ ] `trackPrestataireView()`
  - [ ] `trackContactClick()`
  - [ ] `trackDemandeCreated()`
  - [ ] `trackAvisCreated()`
  - [ ] `trackAbonnementSouscrit()`
- [ ] Configurer les conversions dans GA4
- [ ] Créer un dashboard GA4 personnalisé

#### Error Tracking (Sentry)

- [ ] Créer un compte Sentry
- [ ] Installer Sentry : `npm install @sentry/nextjs`
- [ ] Configurer `sentry.client.config.js`
- [ ] Configurer `sentry.server.config.js`
- [ ] Configurer `sentry.edge.config.js`
- [ ] Tester l'envoi d'erreurs
- [ ] Configurer les alertes email/Slack
- [ ] Intégrer avec le backend NestJS

---

### 💳 **PHASE 10 : INTÉGRATIONS PAIEMENT**

#### Wave Money

- [ ] Contacter Wave pour obtenir accès API
- [ ] Obtenir credentials sandbox
- [ ] Créer `backend/src/paiements/providers/wave.service.ts`
- [ ] Implémenter `initiatePayment()`
- [ ] Implémenter `verifyWebhook()`
- [ ] Implémenter `getTransactionStatus()`
- [ ] Créer l'endpoint webhook Wave
- [ ] Tester en sandbox
- [ ] Obtenir credentials production
- [ ] Configurer en production

#### Orange Money

- [ ] Contacter Orange Money pour obtenir accès API
- [ ] Obtenir credentials sandbox
- [ ] Créer `backend/src/paiements/providers/orange-money.service.ts`
- [ ] Implémenter `getAccessToken()`
- [ ] Implémenter `initiatePayment()`
- [ ] Implémenter `checkTransactionStatus()`
- [ ] Créer l'endpoint webhook Orange Money
- [ ] Tester en sandbox
- [ ] Obtenir credentials production
- [ ] Configurer en production

#### Frontend Paiement

- [ ] Créer la page `/abonnements/paiement`
- [ ] Créer le composant de sélection de méthode
- [ ] Implémenter la redirection vers Wave
- [ ] Implémenter la redirection vers Orange Money
- [ ] Gérer les callbacks success/cancel
- [ ] Afficher le statut du paiement
- [ ] Gérer les erreurs de paiement

---

### 📸 **PHASE 11 : UPLOAD D'IMAGES**

#### Backend Upload

- [ ] Choisir entre AWS S3 ou CloudFlare R2
- [ ] Créer un bucket
- [ ] Configurer CORS
- [ ] Installer les SDK : `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer sharp`
- [ ] Créer le module `backend/src/upload`
- [ ] Créer `upload.service.ts`
- [ ] Implémenter `uploadImage()`
- [ ] Implémenter la compression avec Sharp
- [ ] Implémenter la génération de thumbnails
- [ ] Implémenter `getPresignedUploadUrl()`
- [ ] Créer l'endpoint POST `/upload/image`
- [ ] Configurer multer pour le multipart/form-data

#### Frontend Upload

- [ ] Créer `ImageUpload.tsx`
- [ ] Implémenter la prévisualisation
- [ ] Implémenter la validation (taille, type)
- [ ] Implémenter l'upload avec progress
- [ ] Gérer les erreurs d'upload
- [ ] Ajouter un bouton de suppression
- [ ] Intégrer dans le formulaire prestataire
- [ ] Intégrer dans l'upload KYC

---

### 🗺️ **PHASE 12 : GÉOLOCALISATION AVANCÉE**

#### Service Géolocalisation

- [ ] Créer `frontend/lib/geolocation.ts`
- [ ] Implémenter la classe `GeolocationService`
- [ ] Implémenter `getCurrentPosition()`
- [ ] Implémenter `watchPosition()`
- [ ] Implémenter `stopWatching()`
- [ ] Implémenter `calculateDistance()`
- [ ] Gérer les erreurs de permission
- [ ] Gérer les timeouts

#### Hook Géolocalisation

- [ ] Créer `frontend/hooks/useGeolocation.ts`
- [ ] Implémenter le hook
- [ ] Gérer le cache dans localStorage
- [ ] Gérer les états loading/error
- [ ] Implémenter `requestLocation()`

#### Intégration

- [ ] Utiliser dans la page recherche
- [ ] Afficher la distance sur les cards prestataires
- [ ] Trier par distance
- [ ] Ajouter un filtre de rayon (5km, 10km, 20km)
- [ ] Implémenter le reverse geocoding (coords → adresse)

---

### 🧪 **PHASE 13 : TESTS**

#### Configuration Tests Unitaires

- [ ] Installer Jest : `npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom`
- [ ] Créer `jest.config.js`
- [ ] Créer `jest.setup.js`
- [ ] Configurer le coverage

#### Tests Composants

- [ ] Tester tous les composants UI shadcn/ui
- [ ] Tester Button
- [ ] Tester Card
- [ ] Tester Input
- [ ] Tester Select
- [ ] Tester les composants métier :
  - [ ] MapView
  - [ ] RatingStars
  - [ ] AvisModal
  - [ ] ContactPrestataireButton
  - [ ] ImageUpload
  - [ ] InstallPrompt

#### Tests Hooks

- [ ] Tester useGeolocation
- [ ] Tester useOfflineSync
- [ ] Tester usePrestataires (React Query)
- [ ] Tester useAuth

#### Tests E2E (Playwright)

- [ ] Installer Playwright : `npm install --save-dev @playwright/test`
- [ ] Configurer `playwright.config.ts`
- [ ] Créer les tests :
  - [ ] `e2e/auth.spec.ts` (connexion)
  - [ ] `e2e/search.spec.ts` (recherche)
  - [ ] `e2e/prestataire-detail.spec.ts` (fiche)
  - [ ] `e2e/demande.spec.ts` (création demande)
  - [ ] `e2e/avis.spec.ts` (laisser un avis)
  - [ ] `e2e/abonnement.spec.ts` (souscrire)
  - [ ] `e2e/paiement.spec.ts` (payer)
- [ ] Tester sur Chrome Desktop
- [ ] Tester sur Firefox Desktop
- [ ] Tester sur Mobile Chrome
- [ ] Tester sur Mobile Safari

#### Tests Manuels

- [ ] Tester sur un vrai iPhone
- [ ] Tester sur un vrai Android
- [ ] Tester l'installation (A2HS)
- [ ] Tester le mode offline
- [ ] Tester les notifications push
- [ ] Tester sur connexion lente (throttling 3G)

---

### 🔍 **PHASE 14 : AUDITS & OPTIMISATIONS**

#### Lighthouse

- [ ] Installer lighthouse : `npm install --save-dev lighthouse chrome-launcher`
- [ ] Créer `scripts/lighthouse-audit.js`
- [ ] Lancer l'audit
- [ ] Viser score Performance > 90
- [ ] Viser score Accessibility > 90
- [ ] Viser score Best Practices > 90
- [ ] Viser score SEO > 90
- [ ] Viser score PWA = 100
- [ ] Corriger tous les points rouges
- [ ] Intégrer dans CI/CD

#### Optimisations Finales

- [ ] Réduire le bundle size
- [ ] Éliminer le code mort
- [ ] Minifier les assets
- [ ] Optimiser les fonts
- [ ] Implémenter le preloading des ressources critiques
- [ ] Implémenter le prefetching des pages
- [ ] Optimiser le Critical Rendering Path

---

### 📱 **PHASE 15 : FEATURES PWA AVANCÉES**

#### Web Share API

- [ ] Créer `frontend/lib/share.ts`
- [ ] Implémenter `shareContent()`
- [ ] Créer `ShareButton.tsx`
- [ ] Ajouter sur les fiches prestataires
- [ ] Ajouter un fallback clipboard

#### Contact Picker API

- [ ] Implémenter `selectContact()`
- [ ] Intégrer dans le formulaire de demande (optionnel)

#### Background Fetch API

- [ ] Implémenter `downloadInBackground()`
- [ ] Utiliser pour télécharger les factures PDF
- [ ] Utiliser pour télécharger les documents KYC

#### Biometric Authentication (WebAuthn)

- [ ] Créer `frontend/lib/webauthn.ts`
- [ ] Implémenter `registerBiometric()`
- [ ] Implémenter `loginWithBiometric()`
- [ ] Créer les endpoints backend :
  - [ ] POST `/auth/webauthn/register-challenge`
  - [ ] POST `/auth/webauthn/register-verify`
  - [ ] POST `/auth/webauthn/login-challenge`
  - [ ] POST `/auth/webauthn/login-verify`
- [ ] Ajouter dans les paramètres utilisateur
- [ ] Tester sur iOS (Face ID)
- [ ] Tester sur Android (empreinte digitale)

---

### 🚀 **PHASE 16 : DÉPLOIEMENT & CI/CD**

#### Configuration Production

- [ ] Configurer les variables d'environnement production
- [ ] Configurer le domaine DNS
- [ ] Obtenir un certificat SSL/TLS (Let's Encrypt ou autre)
- [ ] Configurer HTTPS
- [ ] Configurer le CDN pour les assets statiques

#### Docker Production

- [ ] Optimiser les Dockerfiles pour production
- [ ] Utiliser multi-stage builds
- [ ] Réduire la taille des images
- [ ] Configurer Docker Compose pour production

#### CI/CD (GitHub Actions)

- [ ] Créer `.github/workflows/frontend.yml`
- [ ] Créer `.github/workflows/backend.yml`
- [ ] Configurer les tests automatiques
- [ ] Configurer le build automatique
- [ ] Configurer le déploiement automatique
- [ ] Configurer les notifications Slack/Discord

#### Monitoring Production

- [ ] Configurer Sentry pour production
- [ ] Configurer Google Analytics pour production
- [ ] Mettre en place un système de logs centralisé
- [ ] Configurer des alertes (uptime, erreurs, performance)
- [ ] Créer un dashboard de monitoring

---

### 📚 **PHASE 17 : DOCUMENTATION**

#### Documentation Technique

- [ ] Créer `ARCHITECTURE.md`
- [ ] Créer `API_DOCUMENTATION.md`
- [ ] Créer `DEPLOYMENT.md`
- [ ] Créer `TESTING.md`
- [ ] Créer `TROUBLESHOOTING.md`
- [ ] Documenter toutes les variables d'environnement
- [ ] Créer des diagrammes d'architecture
- [ ] Documenter le schéma de base de données

#### Documentation Utilisateur

- [ ] Créer un guide d'utilisation pour les clients
- [ ] Créer un guide d'utilisation pour les prestataires
- [ ] Créer un guide d'utilisation pour les admins
- [ ] Créer des tutoriels vidéo (optionnel)
- [ ] Créer une FAQ

#### Documentation Développeur

- [ ] Documenter les conventions de code
- [ ] Documenter le workflow Git
- [ ] Créer un guide de contribution
- [ ] Documenter l'architecture des composants
- [ ] Créer un Storybook (optionnel)

---

### 🎉 **PHASE 18 : LANCEMENT**

#### Pré-lancement

- [ ] Effectuer un audit de sécurité complet
- [ ] Tester tous les parcours utilisateur
- [ ] Vérifier tous les emails/notifications
- [ ] Préparer les supports marketing
- [ ] Créer les comptes réseaux sociaux
- [ ] Préparer le communiqué de presse

#### Tests Bêta

- [ ] Recruter des bêta-testeurs (10-20 personnes)
- [ ] Distribuer l'app aux testeurs
- [ ] Collecter les retours
- [ ] Corriger les bugs critiques
- [ ] Améliorer l'UX selon les retours

#### Lancement

- [ ] Déployer en production
- [ ] Activer Google Analytics
- [ ] Activer les notifications push
- [ ] Publier sur les réseaux sociaux
- [ ] Envoyer le communiqué de presse
- [ ] Monitorer les premiers utilisateurs
- [ ] Être prêt à réagir rapidement aux problèmes

#### Post-lancement

- [ ] Analyser les métriques jour 1, jour 7, jour 30
- [ ] Collecter les retours utilisateurs
- [ ] Planifier les améliorations prioritaires
- [ ] Itérer rapidement sur les bugs
- [ ] Communiquer régulièrement avec les utilisateurs

---

## 📊 **Récapitulatif par Catégorie**

### PWA Core (25 tâches)

- Manifest & Icons : 14 tâches
- Service Worker : 7 tâches
- Meta Tags : 4 tâches

### Notifications (21 tâches)

- Firebase Setup : 11 tâches
- Frontend : 5 tâches
- Backend : 5 tâches

### Stockage Offline (18 tâches)

- Configuration : 5 tâches
- Utilitaires : 6 tâches
- Queue Offline : 4 tâches
- Intégration : 3 tâches

### UI/UX (37 tâches)

- Composants shadcn/ui : 11 tâches
- Composants métier : 14 tâches
- Mobile First : 12 tâches

### Sécurité (19 tâches)

- Headers : 8 tâches
- Rate Limiting : 4 tâches
- Sanitization : 6 tâches
- Validation : 1 tâche

### Performance (23 tâches)

- Images : 7 tâches
- Code Splitting : 5 tâches
- React Query : 8 tâches
- Web Vitals : 3 tâches

### Analytics (15 tâches)

- Google Analytics : 8 tâches
- Sentry : 7 tâches

### Intégrations (28 tâches)

- Wave Money : 10 tâches
- Orange Money : 10 tâches
- Upload Images : 8 tâches

### Géolocalisation (14 tâches)

- Service : 8 tâches
- Hook : 3 tâches
- Intégration : 3 tâches

### Tests (35 tâches)

- Configuration : 4 tâches
- Tests Unitaires : 12 tâches
- Tests E2E : 14 tâches
- Tests Manuels : 5 tâches

### Audits (15 tâches)

- Lighthouse : 9 tâches
- Optimisations : 6 tâches

### Features Avancées (16 tâches)

- Web Share : 5 tâches
- Contact Picker : 2 tâches
- Background Fetch : 3 tâches
- WebAuthn : 6 tâches

### Déploiement (18 tâches)

- Production : 5 tâches
- Docker : 3 tâches
- CI/CD : 5 tâches
- Monitoring : 5 tâches

### Documentation (13 tâches)

- Technique : 8 tâches
- Utilisateur : 3 tâches
- Développeur : 2 tâches

### Lancement (17 tâches)

- Pré-lancement : 6 tâches
- Bêta : 4 tâches
- Lancement : 7 tâches

---

## 🎯 **TOTAL : ~318 tâches**

**Estimation totale : 10-12 semaines (2,5-3 mois) pour 1 développeur full-time**

---

## 📌 **Tâches Prioritaires Immédiates (Quick Wins)**

Si vous devez commencer maintenant, voici les 10 premières tâches à faire :

1. ✅ **Créer manifest.json** (30 min)
2. ✅ **Installer next-pwa et configurer** (1h)
3. ✅ **Générer les icônes PWA** (1h)
4. ✅ **Ajouter meta tags SEO** (30 min)
5. ✅ **Créer InstallPrompt.tsx** (2h)
6. ✅ **Configurer Firebase et notifications** (3h)
7. ✅ **Installer Dexie et configurer IndexedDB** (2h)
8. ✅ **Créer OfflineIndicator.tsx** (1h)
9. ✅ **Configurer Google Analytics** (1h)
10. ✅ **Tester PWA sur mobile réel** (1h)

**Total Quick Wins : ~12-15 heures de développement**

Cela vous donnera une base PWA fonctionnelle immédiatement ! 🚀
