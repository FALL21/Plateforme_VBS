'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [isAuthenticated, user, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports & Analytics</h1>
            <p className="text-gray-600 mt-2">KPIs et statistiques détaillées</p>
          </div>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            ← Retour au dashboard
          </Button>
        </div>

        {/* KPIs Principaux */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">📊 Indicateurs clés de performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats?.totalUtilisateurs || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Total inscrits</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Prestataires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats?.totalPrestataires || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Actifs</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Abonnements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.abonnementsActifs || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Actifs</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">CA Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(stats?.chiffreAffaireTotal || 0).toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-xs text-gray-500 mt-1">Revenus</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activité */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">🔥 Activité de la plateforme</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Demandes actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{stats?.demandesActives || 0}</div>
                <div className="text-xs text-gray-500 mt-1">En cours de traitement</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Commandes en cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-600">{stats?.commandesEnCours || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Services en exécution</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">KYC en attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats?.prestatairesPendingKyc || 0}</div>
                <div className="text-xs text-gray-500 mt-1">À valider</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversions et Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">💰 Performance financière</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus</CardTitle>
                <CardDescription>Par source de paiement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Abonnements actifs</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats?.abonnementsActifs || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">CA Total</span>
                    <span className="text-lg font-bold text-purple-600">
                      {(stats?.chiffreAffaireTotal || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de conversion</CardTitle>
                <CardDescription>Inscriptions → Prestataires actifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Prestataires / Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      {stats?.totalUtilisateurs > 0 
                        ? ((stats.totalPrestataires / stats.totalUtilisateurs) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Prestataires avec abonnement</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats?.totalPrestataires > 0
                        ? ((stats.abonnementsActifs / stats.totalPrestataires) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Actions rapides</CardTitle>
            <CardDescription>Raccourcis vers les fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => router.push('/admin/validations/prestataires')}
              >
                <span className="text-lg mb-1">✅</span>
                <span className="font-medium">Valider KYC</span>
                <span className="text-xs text-gray-500 mt-1">
                  {stats?.prestatairesPendingKyc || 0} en attente
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => router.push('/admin/validations/paiements')}
              >
                <span className="text-lg mb-1">💳</span>
                <span className="font-medium">Valider paiements</span>
                <span className="text-xs text-gray-500 mt-1">
                  {stats?.paiementsPendingValidation || 0} en attente
                </span>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-start"
                onClick={() => router.push('/admin/users')}
              >
                <span className="text-lg mb-1">👥</span>
                <span className="font-medium">Gérer utilisateurs</span>
                <span className="text-xs text-gray-500 mt-1">
                  {stats?.totalUtilisateurs || 0} total
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ℹ️ À propos des rapports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Cette page présente les indicateurs clés de performance (KPIs) de la plateforme.
              Les données sont mises à jour en temps réel à chaque chargement de page.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Prochainement :</strong> Graphiques d'évolution, exports CSV/Excel, et analyses prédictives.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

