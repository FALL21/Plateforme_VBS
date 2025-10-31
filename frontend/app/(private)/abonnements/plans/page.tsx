'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPlans = async () => {
      try {
        const response = await api.get('/abonnements/plans');
        setPlans(response.data || []);
      } catch (error) {
        console.error('Erreur chargement plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
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

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Plans d'abonnement</h1>
          <p className="text-gray-600">Choisissez le plan qui vous convient</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Mensuel */}
          {mensuelPlan && (
            <Card className={mensuelPlan.actif ? '' : 'opacity-60'}>
              <CardHeader>
                <CardTitle>{mensuelPlan.nom}</CardTitle>
                <CardDescription>Renouvellement mensuel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">
                    {formatPrice(mensuelPlan.prix)}
                  </div>
                  <div className="text-sm text-gray-600">par mois</div>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Visibilité sur la plateforme
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Apparition dans les recherches
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Profil complet accessible
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Support client
                  </li>
                </ul>

                <Button
                  className="w-full"
                  disabled={!mensuelPlan.actif}
                  onClick={() => router.push(`/abonnements/souscrire?planId=${mensuelPlan.id}`)}
                >
                  {mensuelPlan.actif ? 'Souscrire' : 'Indisponible'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Plan Annuel */}
          {annuelPlan && (
            <Card className={`relative ${annuelPlan.actif ? 'border-primary border-2' : 'opacity-60'}`}>
              {annuelPlan.actif && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Recommandé
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{annuelPlan.nom}</CardTitle>
                <CardDescription>Renouvellement annuel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-4xl font-bold mb-2">
                    {formatPrice(annuelPlan.prix)}
                  </div>
                  <div className="text-sm text-gray-600">par an</div>
                  {mensuelPlan && (
                    <div className="text-sm text-green-600 mt-1">
                      Économisez {formatPrice(mensuelPlan.prix * 12 - annuelPlan.prix)} par an
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Tous les avantages du plan mensuel
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Économie de 20% sur l'année
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Priorité dans les résultats
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Support prioritaire
                  </li>
                </ul>

                <Button
                  className="w-full"
                  variant={annuelPlan.actif ? 'default' : 'secondary'}
                  disabled={!annuelPlan.actif}
                  onClick={() => router.push(`/abonnements/souscrire?planId=${annuelPlan.id}`)}
                >
                  {annuelPlan.actif ? 'Souscrire' : 'Indisponible'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/prestataire">
            <Button variant="outline">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

