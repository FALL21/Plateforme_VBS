"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
  const [stats, setStats] = useState({
    totalUtilisateurs: 0,
    totalPrestataires: 0,
    prestatairesPendingKyc: 0,
    paiementsPendingValidation: 0,
    abonnementsEnAttente: 0,
    demandesActives: 0,
    commandesEnCours: 0,
    chiffreAffaireTotal: 0,
    abonnementsActifs: 0,
    // Stats périodiques
    nouveauxUtilisateurs: 0,
    nouveauxPrestataires: 0,
    nouvellesDemandes: 0,
    nouvellesCommandes: 0,
    commandesTerminees: 0,
    nouveauxAbonnements: 0,
    paiementsValides: 0,
    paiementsEnAttente: 0,
    chiffreAffaire: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiDialog, setKpiDialog] = useState<{
    title: string;
    value: string;
    description?: string;
    linkHref?: string;
    linkLabel?: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const params = period !== 'all' ? { params: { period } } : {};
        const statsRes = await api.get('/admin/stats', params);
        setStats({ ...stats, ...statsRes.data });
        const activitiesRes = await api.get('/admin/activities');
        setRecentActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Erreur chargement données admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router, period]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement du dashboard...</div>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'primary',
    trend,
    onClick 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color?: 'primary' | 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal';
    trend?: string;
    onClick?: () => void;
  }) => {
    const colorClasses = {
      primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
      blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200',
      green: 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200',
      purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200',
      orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200',
      indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200',
      teal: 'bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200',
    };

    const textColors = {
      primary: 'text-primary',
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      indigo: 'text-indigo-600',
      teal: 'text-teal-600',
    };

    return (
      <Card 
        className={`${colorClasses[color]} border-2 border-opacity-70 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                <div className={`p-2 sm:p-2.5 rounded-xl ${colorClasses[color]} bg-white/70 shadow-sm`}>
                  {icon}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{title}</p>
              </div>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textColors[color]} mb-1 sm:mb-2`}>
                {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
              </div>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
              {trend && (
                <p className="text-[11px] sm:text-xs text-green-600 mt-2 font-semibold">
                  {trend}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Header spécifique au dashboard */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8">
          <div className="mb-5 sm:mb-6 lg:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  Dashboard Administrateur
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Vue d'ensemble de la plateforme VBS
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'all') => setPeriod(value)}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11 bg-white border-2 border-gray-200 hover:border-primary/30 transition-colors">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center px-3 sm:px-4 py-2 bg-white border-2 border-gray-200 rounded-md">
                  <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertes urgentes */}
          {(stats.prestatairesPendingKyc > 0 || stats.abonnementsEnAttente > 0) && (
            <div className="mb-4 sm:mb-6 lg:mb-8 space-y-3 sm:space-y-4">
            {stats.abonnementsEnAttente > 0 && (
              <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-blue-50 via-blue-50/50 to-indigo-50 border-l-4 border-blue-500 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-5 flex-1 min-w-0">
                    <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl flex-shrink-0 shadow-sm">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl">
                        {stats.abonnementsEnAttente} demande(s) d'abonnement en attente
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
                        Des prestataires attendent l'activation de leur abonnement
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/validations/paiements" className="w-full sm:w-auto flex-shrink-0">
                    <Button className="w-full sm:w-auto h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                      Voir les demandes
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {stats.prestatairesPendingKyc > 0 && (
              <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-yellow-50 via-orange-50/50 to-orange-50 border-l-4 border-yellow-500 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 lg:gap-5 flex-1 min-w-0">
                    <div className="p-2.5 sm:p-3 bg-yellow-100 rounded-xl flex-shrink-0 shadow-sm">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl">
                        {stats.prestatairesPendingKyc} prestataire(s) en attente de validation KYC
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
                        Action requise pour activer ces comptes
                      </div>
                    </div>
                  </div>
                  <Link href="/admin/validations/prestataires" className="w-full sm:w-auto flex-shrink-0">
                    <Button className="w-full sm:w-auto h-10 sm:h-11 bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                      Valider maintenant
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Statistiques principales */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                Indicateurs clés de performance
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Utilisateurs inscrits"
            value={stats.totalUtilisateurs}
            subtitle="Total des comptes créés"
            color="primary"
            icon={
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'Utilisateurs inscrits',
                value: stats.totalUtilisateurs.toLocaleString('fr-FR'),
                description:
                  "Nombre total de comptes créés sur la plateforme, tous rôles confondus (clients, prestataires, administrateurs).",
                linkHref: '/admin/users',
                linkLabel: 'Voir la liste des utilisateurs',
              })
            }
          />
          <StatCard
            title={period !== 'all' ? 'Nouveaux prestataires' : 'Prestataires actifs'}
            value={period !== 'all' ? stats.nouveauxPrestataires : stats.totalPrestataires}
            subtitle={period !== 'all' ? `Nouveaux cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}` : 'Prestataires actuellement visibles'}
            color="blue"
            icon={
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'Prestataires actifs',
                value: stats.totalPrestataires.toLocaleString('fr-FR'),
                description:
                  "Prestataires dont le compte est actif, avec abonnement valide et profil visible dans la recherche publique.",
                linkHref: '/admin/users?role=PRESTATAIRE',
                linkLabel: 'Voir les prestataires',
              })
            }
          />
          <StatCard
            title={period !== 'all' ? 'Nouveaux abonnements' : 'Abonnements actifs'}
            value={period !== 'all' ? stats.nouveauxAbonnements : stats.abonnementsActifs}
            subtitle={period !== 'all' ? `Nouveaux cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}` : 'Abonnements prestataires en cours'}
            color="green"
            icon={
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'Abonnements actifs',
                value: stats.abonnementsActifs.toLocaleString('fr-FR'),
                description:
                  "Nombre d’abonnements en cours de validité pour les prestataires (mensuels ou annuels).",
                linkHref: '/admin/validations/paiements',
                linkLabel: 'Gérer les abonnements et paiements',
              })
            }
          />
          <StatCard
            title={period !== 'all' ? "Chiffre d'affaires" : "Chiffre d'affaires total"}
            value={`${(period !== 'all' ? stats.chiffreAffaire : stats.chiffreAffaireTotal).toLocaleString('fr-FR')} FCFA`}
            subtitle={period !== 'all' ? `CA cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}` : 'Montant cumulé des abonnements'}
            color="purple"
            icon={
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: "Chiffre d'affaires total",
                value: `${stats.chiffreAffaireTotal.toLocaleString('fr-FR')} FCFA`,
                description:
                  "Montant cumulé encaissé via les abonnements prestataires (Wave, espèces, etc.).",
                linkHref: '/admin/reports',
                linkLabel: 'Voir les rapports détaillés',
              })
            }
          />
            </div>
          </div>

          {/* Activité en temps réel */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                Activité en temps réel
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title={period !== 'all' ? 'Nouvelles demandes' : 'Demandes ouvertes'}
            value={period !== 'all' ? stats.nouvellesDemandes : stats.demandesActives}
            subtitle={period !== 'all' ? `Nouvelles cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}` : 'Demandes clients en attente de prise en charge'}
            color="indigo"
            icon={
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'Demandes ouvertes',
                value: stats.demandesActives.toLocaleString('fr-FR'),
                description:
                  'Demandes de services encore actives dans le système (ni annulées, ni converties en commandes terminées).',
                linkHref: '/admin/demandes',
                linkLabel: 'Voir les demandes clients',
              })
            }
          />
          <StatCard
            title={period !== 'all' ? 'Nouvelles commandes' : 'Commandes en cours'}
            value={period !== 'all' ? stats.nouvellesCommandes : stats.commandesEnCours}
            subtitle={period !== 'all' ? `Nouvelles cette ${period === 'daily' ? 'journée' : period === 'weekly' ? 'semaine' : 'mois'}` : 'Commandes acceptées mais non terminées'}
            color="teal"
            icon={
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'Commandes en cours',
                value: stats.commandesEnCours.toLocaleString('fr-FR'),
                description:
                  'Commandes de prestations déjà acceptées mais encore en cours de réalisation.',
                linkHref: '/admin/commandes',
                linkLabel: 'Voir les commandes clients',
              })
            }
          />
          <StatCard
            title="KYC en attente"
            value={stats.prestatairesPendingKyc}
            subtitle="Profils prestataires à vérifier"
            color="orange"
            icon={
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() =>
              setKpiDialog({
                title: 'KYC en attente',
                value: stats.prestatairesPendingKyc.toLocaleString('fr-FR'),
                description:
                  'Profils prestataires pour lesquels une vérification des documents (KYC) doit encore être effectuée.',
                linkHref: '/admin/validations/prestataires',
                linkLabel: 'Aller valider les prestataires',
              })
            }
          />
            </div>
          </div>

          {/* Activités récentes */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
            <CardHeader className="bg-gradient-to-r from-gray-50 via-gray-50/50 to-white border-b-2 p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Activités récentes</CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm text-gray-600">Historique des actions administratives</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 lg:p-6">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-base sm:text-lg">Aucune activité récente</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">Les actions administratives apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentActivities.slice(0, 10).map((activity: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border-2 rounded-xl hover:bg-gray-50 hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0 shadow-sm">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">{activity.action}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{activity.description}</div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap ml-7 sm:ml-0 bg-gray-50 px-2 py-1 rounded-md">
                      {new Date(activity.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      {/* Dialog d'information KPI */}
      <Dialog open={!!kpiDialog} onOpenChange={(open) => !open && setKpiDialog(null)}>
        <DialogContent className="max-w-md">
          {kpiDialog && (
            <>
              <DialogHeader>
                <DialogTitle>{kpiDialog.title}</DialogTitle>
                <DialogDescription>Vue détaillée de ce indicateur.</DialogDescription>
              </DialogHeader>
              <div className="mt-3 space-y-3">
                <div className="text-3xl font-bold text-primary">
                  {kpiDialog.value}
                </div>
                {kpiDialog.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {kpiDialog.description}
                  </p>
                )}
                {kpiDialog.linkHref && kpiDialog.linkLabel && (
                  <div className="pt-2">
                    <Link
                      href={kpiDialog.linkHref}
                      onClick={() => setKpiDialog(null)}
                      className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                    >
                      {kpiDialog.linkLabel}
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
