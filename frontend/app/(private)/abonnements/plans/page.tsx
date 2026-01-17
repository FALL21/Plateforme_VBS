'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  nom: string;
  type: 'MENSUEL' | 'ANNUEL';
  prix: number;
  actif: boolean;
}

export default function PlansAbonnementsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAbonnement, setCurrentAbonnement] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPlansAndCurrent = async () => {
      try {
        const [plansRes, currentRes] = await Promise.all([
          api.get('/abonnements/plans'),
          api.get('/abonnements/me').catch(() => ({ data: null })),
        ]);
        setPlans(plansRes.data || []);
        setCurrentAbonnement(currentRes.data ?? null);
      } catch (error) {
        console.error('Erreur chargement plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndCurrent();
  }, [isAuthenticated, router]);

  const formatPrice = (prix: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(prix);
  };

  const mensuelPlan = plans.find((p) => p.type === 'MENSUEL');
  const annuelPlan = plans.find((p) => p.type === 'ANNUEL');
  const currentPlanId = useMemo(() => currentAbonnement?.plan?.id ?? null, [currentAbonnement]);
  const currentPlanType = useMemo(() => currentAbonnement?.type ?? null, [currentAbonnement]);
  const currentStatus = currentAbonnement?.statut;
  const isCurrentPlan = (plan?: Plan | null) => {
    if (!plan || !currentAbonnement) return false;
    if (currentPlanId && plan.id === currentPlanId) return true;
    return plan.type === currentPlanType;
  };
  const buttonLabel = (plan?: Plan | null) => {
    if (!plan) return 'Souscrire';
    if (isCurrentPlan(plan)) {
      return currentStatus === 'EN_ATTENTE' ? 'En validation' : 'Plan actuel';
    }
    return 'Souscrire';
  };
  const buttonDisabled = (plan?: Plan | null) =>
    !plan?.actif || (plan?.actif && isCurrentPlan(plan));

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Plans d'abonnement</h1>
          <p className="text-gray-600 text-sm sm:text-base">Choisissez le plan qui vous convient</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Plan Mensuel */}
          {mensuelPlan && (
            <Card
              className={`${mensuelPlan.actif ? '' : 'opacity-60'} ${
                isCurrentPlan(mensuelPlan) ? 'border-2 border-green-500' : ''
              } h-full`}
            >
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <span className="text-lg sm:text-xl">{mensuelPlan.nom}</span>
                  {isCurrentPlan(mensuelPlan) && (
                    <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-green-600 text-white whitespace-nowrap">
                      {currentStatus === 'EN_ATTENTE' ? 'En validation' : 'Plan actuel'}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Renouvellement mensuel</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">
                    {formatPrice(mensuelPlan.prix)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">par mois</div>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Visibilité sur la plateforme</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Apparition dans les recherches</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Profil complet accessible</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Support client</span>
                  </li>
                </ul>

                <Button
                  className="w-full text-sm sm:text-base"
                  disabled={buttonDisabled(mensuelPlan)}
                  variant={isCurrentPlan(mensuelPlan) ? 'secondary' : 'default'}
                  onClick={() =>
                    !isCurrentPlan(mensuelPlan) &&
                    router.push(`/abonnements/souscrire?planId=${mensuelPlan.id}`)
                  }
                >
                  {mensuelPlan.actif ? buttonLabel(mensuelPlan) : 'Indisponible'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Plan Annuel */}
          {annuelPlan && (
            <Card
              className={`relative h-full ${
                annuelPlan.actif ? 'border-primary border-2' : 'opacity-60'
              } ${isCurrentPlan(annuelPlan) ? 'border-green-500 border-2' : ''}`}
            >
              {annuelPlan.actif && !isCurrentPlan(annuelPlan) && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    Recommandé
                  </span>
                </div>
              )}
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <span className="text-lg sm:text-xl">{annuelPlan.nom}</span>
                  {isCurrentPlan(annuelPlan) && (
                    <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-green-600 text-white whitespace-nowrap">
                      {currentStatus === 'EN_ATTENTE' ? 'En validation' : 'Plan actuel'}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Renouvellement annuel</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">
                    {formatPrice(annuelPlan.prix)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">par an</div>
                  {mensuelPlan && (
                    <div className="text-xs sm:text-sm text-green-600 mt-1">
                      Économisez {formatPrice(mensuelPlan.prix * 12 - annuelPlan.prix)} par an
                    </div>
                  )}
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Tous les avantages du plan mensuel</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Économie de 20% sur l'année</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Priorité dans les résultats</span>
                  </li>
                  <li className="flex items-start sm:items-center text-sm sm:text-base">
                    <span className="text-green-600 mr-2 flex-shrink-0">✓</span>
                    <span>Support prioritaire</span>
                  </li>
                </ul>

                <Button
                  className="w-full text-sm sm:text-base"
                  variant={
                    annuelPlan.actif && !isCurrentPlan(annuelPlan) ? 'default' : 'secondary'
                  }
                  disabled={buttonDisabled(annuelPlan)}
                  onClick={() =>
                    !isCurrentPlan(annuelPlan) &&
                    router.push(`/abonnements/souscrire?planId=${annuelPlan.id}`)
                  }
                >
                  {annuelPlan.actif ? buttonLabel(annuelPlan) : 'Indisponible'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <Link href="/prestataire/dashboard">
            <Button variant="outline" className="text-sm sm:text-base">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

