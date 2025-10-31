'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUtilisateurs: 0,
    totalPrestataires: 0,
    prestatairesPendingKyc: 0,
    paiementsPendingValidation: 0,
    demandesActives: 0,
    commandesEnCours: 0,
    chiffreAffaireTotal: 0,
    abonnementsActifs: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Récupérer les statistiques globales
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data || stats);

        // Récupérer les activités récentes
        const activitiesRes = await api.get('/admin/activities');
        setRecentActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Erreur chargement données admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="text-gray-600 mt-2">Gestion de la plateforme VBS</p>
        </div>

        {/* Alertes */}
        {(stats.prestatairesPendingKyc > 0 || stats.paiementsPendingValidation > 0) && (
          <div className="mb-6 space-y-3">
            {stats.prestatairesPendingKyc > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <div className="font-medium text-yellow-900">
                        {stats.prestatairesPendingKyc} prestataire(s) en attente de validation KYC
                      </div>
                    </div>
                  </div>
                  <Link 
                    href="/admin/validations/prestataires" 
                    className="text-sm text-yellow-700 hover:underline"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.paiementsPendingValidation > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">💰</span>
                    <div>
                      <div className="font-medium text-orange-900">
                        {stats.paiementsPendingValidation} paiement(s) en espèces à valider
                      </div>
                    </div>
                  </div>
                  <Link 
                    href="/admin/validations/paiements" 
                    className="text-sm text-orange-700 hover:underline"
                  >
                    Voir →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalUtilisateurs}</div>
              <div className="text-xs text-gray-500 mt-1">Total inscrits</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Prestataires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalPrestataires}</div>
              <div className="text-xs text-gray-500 mt-1">Actifs sur la plateforme</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Abonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.abonnementsActifs}</div>
              <div className="text-xs text-gray-500 mt-1">Actifs</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">CA Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.chiffreAffaireTotal.toLocaleString('fr-FR')}
              </div>
              <div className="text-xs text-gray-500 mt-1">FCFA</div>
            </CardContent>
          </Card>
        </div>

        {/* Activité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Demandes actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.demandesActives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Commandes en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-600">{stats.commandesEnCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">KYC en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.prestatairesPendingKyc}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gestion rapide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/secteurs">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏗️ Gérer les secteurs
                </CardTitle>
                <CardDescription>
                  Taxonomie: secteurs, sous-secteurs, services
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/validations/prestataires">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✅ Valider les prestataires
                </CardTitle>
                <CardDescription>
                  Vérification KYC et validation des profils
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/validations/paiements">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Valider les paiements
                </CardTitle>
                <CardDescription>
                  Paiements en espèces à confirmer
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Gérer les utilisateurs
                </CardTitle>
                <CardDescription>
                  Consultation et modération
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Rapports & Analytics
                </CardTitle>
                <CardDescription>
                  KPIs et statistiques détaillées
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/moderation">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🛡️ Modération
                </CardTitle>
                <CardDescription>
                  Avis, signalements, contenus
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Activités récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
            <CardDescription>Actions administratives récentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune activité récente
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.slice(0, 10).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-xs text-gray-600">{activity.description}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

