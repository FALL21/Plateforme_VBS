'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BackButton from '@/components/BackButton';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PrestataireReportsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'PRESTATAIRE') {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [isAuthenticated, user, router, period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        api.get('/prestataires/reports/stats', { params: { period } }),
        api.get('/prestataires/reports/charts', { params: { period } }),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const periodLabels = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Rapports de services prestés
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Statistiques et analyses de vos prestations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPeriod(value)}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11 bg-white border-2 border-gray-200 hover:border-primary/30 transition-colors">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
            <BackButton href="/prestataire/dashboard" label="Retour au dashboard" />
          </div>
        </div>

        {/* KPIs Principaux */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              Indicateurs clés de performance
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Card Commandes */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-transparent hover:border-primary/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-primary/10 rounded-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Commandes</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{periodLabels[period]}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                    {stats?.totalCommandes || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Total: <span className="font-semibold">{stats?.totalCommandesTotal || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Terminées */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-transparent hover:border-green-500/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-green-500/10 rounded-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Terminées</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{periodLabels[period]}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
                    {stats?.commandesTerminees || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Total: <span className="font-semibold">{stats?.commandesTermineesTotal || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card En cours */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-transparent hover:border-blue-500/20 bg-white sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-blue-500/10 rounded-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">En cours</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{periodLabels[period]}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">
                    {stats?.commandesEnCours || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Graphiques */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              Analyses visuelles
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {/* Évolution des commandes */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Évolution des commandes</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">Total vs Terminées</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[280px] lg:h-[300px]">
                  <LineChart data={chartData?.dailyCommandes || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      stroke="#9ca3af"
                      className="text-xs"
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280' }} 
                      stroke="#9ca3af"
                      className="text-xs"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#0088FE" 
                      strokeWidth={2.5}
                      name="Total" 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="terminees" 
                      stroke="#00C49F" 
                      strokeWidth={2.5}
                      name="Terminées" 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par statut */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Répartition par statut</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">Distribution des commandes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={250} className="sm:h-[280px] lg:h-[300px]">
                  <PieChart>
                    <Pie
                      data={chartData?.commandesByStatut ? Object.entries(chartData.commandesByStatut).map(([name, value]) => ({
                        name: name === 'EN_ATTENTE' ? 'En attente' : 
                              name === 'ACCEPTEE' ? 'Acceptée' : 
                              name === 'EN_COURS' ? 'En cours' : 
                              name === 'TERMINEE' ? 'Terminée' : 
                              name === 'ANNULEE' ? 'Annulée' : name,
                        value,
                      })) : []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => {
                        const percentage = ((percent || 0) * 100).toFixed(0);
                        return percentage !== '0' ? `${name}: ${percentage}%` : '';
                      }}
                      outerRadius={70}
                      className="sm:outerRadius-80 lg:outerRadius-90"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData?.commandesByStatut ? Object.entries(chartData.commandesByStatut).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) : null}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition par secteur */}
            {chartData?.commandesBySecteur && Object.keys(chartData.commandesBySecteur).length > 0 && (
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 bg-white lg:col-span-2">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Répartition par secteur</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">Services par domaine</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[280px] lg:h-[300px]">
                    <BarChart 
                      data={Object.entries(chartData.commandesBySecteur).map(([name, value]) => ({
                        name,
                        value,
                      }))}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: '#6b7280' }} 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        stroke="#9ca3af"
                        className="text-xs"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#6b7280' }} 
                        stroke="#9ca3af"
                        className="text-xs"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
