'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [isAuthenticated, user, router, period]);

  const fetchStats = async () => {
    try {
      const params = period !== 'all' ? { params: { period } } : {};
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/admin/stats', params),
        api.get('/admin/charts', params),
      ]);
      setStats(statsRes.data);
      setChartData(chartsRes.data);
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
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'all') => setPeriod(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les données</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              ← Retour au dashboard
            </Button>
          </div>
        </div>

        {/* KPIs Principaux */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">📊 Indicateurs clés de performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Nouveaux utilisateurs' : 'Utilisateurs'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {period !== 'all' ? (stats?.nouveauxUtilisateurs || 0) : (stats?.totalUtilisateurs || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `Nouveaux cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'Total inscrits'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Nouveaux prestataires' : 'Prestataires'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {period !== 'all' ? (stats?.nouveauxPrestataires || 0) : (stats?.totalPrestataires || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `Nouveaux cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'Actifs'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Nouveaux abonnements' : 'Abonnements'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {period !== 'all' ? (stats?.nouveauxAbonnements || 0) : (stats?.abonnementsActifs || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `Nouveaux cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'Actifs'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Chiffre d\'affaires' : 'CA Total'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(period !== 'all' ? (stats?.chiffreAffaire || 0) : (stats?.chiffreAffaireTotal || 0)).toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `CA cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'Revenus'}
                </div>
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
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Nouvelles demandes' : 'Demandes actives'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {period !== 'all' ? (stats?.nouvellesDemandes || 0) : (stats?.demandesActives || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `Nouvelles cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'En cours de traitement'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {period !== 'all' ? 'Nouvelles commandes' : 'Commandes en cours'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-600">
                  {period !== 'all' ? (stats?.nouvellesCommandes || 0) : (stats?.commandesEnCours || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {period !== 'all' 
                    ? `Nouvelles cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}`
                    : 'Services en exécution'}
                </div>
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

        {/* Graphiques */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">📈 Visualisations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique d'évolution des inscriptions */}
            {chartData?.dailyUsers && chartData.dailyUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des inscriptions</CardTitle>
                  <CardDescription>30 derniers jours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.dailyUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" name="Total" strokeWidth={2} />
                      <Line type="monotone" dataKey="clients" stroke="#10b981" name="Clients" strokeWidth={2} />
                      <Line type="monotone" dataKey="prestataires" stroke="#8b5cf6" name="Prestataires" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Répartition des rôles */}
            {chartData?.roleDistribution && chartData.roleDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des utilisateurs</CardTitle>
                  <CardDescription>Par type de compte</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.roleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.roleDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Répartition des statuts de commandes */}
            {chartData?.commandesByStatut && chartData.commandesByStatut.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Statuts des commandes</CardTitle>
                  <CardDescription>Répartition par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.commandesByStatut}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Évolution du CA */}
            {chartData?.monthlyRevenue && chartData.monthlyRevenue.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                  <CardDescription>
                    {period === 'daily' ? 'Aujourd\'hui (par heure)' : 
                     period === 'weekly' ? 'Cette semaine (par jour)' :
                     period === 'monthly' ? 'Ce mois (par semaine)' :
                     '6 derniers mois'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number | undefined) => value ? `${value.toLocaleString('fr-FR')} FCFA` : '0 FCFA'} />
                      <Legend />
                      <Bar dataKey="abonnements" stackId="a" fill="#10b981" name="Abonnements" />
                      <Bar dataKey="commandes" stackId="a" fill="#3b82f6" name="Commandes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
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
                {chartData?.monthlyRevenue && chartData.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Abonnements',
                            value: chartData.monthlyRevenue.reduce((sum: number, m: any) => sum + m.abonnements, 0),
                            color: '#10b981',
                          },
                          {
                            name: 'Commandes',
                            value: chartData.monthlyRevenue.reduce((sum: number, m: any) => sum + m.commandes, 0),
                            color: '#3b82f6',
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Abonnements', value: chartData.monthlyRevenue.reduce((sum: number, m: any) => sum + m.abonnements, 0), color: '#10b981' },
                          { name: 'Commandes', value: chartData.monthlyRevenue.reduce((sum: number, m: any) => sum + m.commandes, 0), color: '#3b82f6' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => value ? `${value.toLocaleString('fr-FR')} FCFA` : '0 FCFA'} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
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
                )}
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

