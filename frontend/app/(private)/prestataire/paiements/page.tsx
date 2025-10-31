'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Paiement {
  id: string;
  methode: string;
  montant: number;
  statut: string;
  createdAt: string;
  dateValidation?: string;
  abonnement?: {
    type: string;
    plan?: {
      nom: string;
    };
  };
}

export default function HistoriquePaiementsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPaiements = async () => {
      try {
        const response = await api.get('/paiements/me/historique');
        setPaiements(response.data || []);
      } catch (error) {
        console.error('Erreur chargement paiements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaiements();
  }, [isAuthenticated, router]);

  const getStatusBadge = (statut: string) => {
    const styles = {
      VALIDE: 'bg-green-100 text-green-800',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      REFUSE: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {statut}
      </span>
    );
  };

  const formatPrice = (prix: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(prix);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Historique des paiements</h1>
          <Button onClick={() => router.push('/abonnements/plans')}>
            Nouveau paiement
          </Button>
        </div>

        {paiements.length > 0 ? (
          <div className="space-y-4">
            {paiements.map((paiement) => (
              <Card key={paiement.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {paiement.abonnement?.plan?.nom || 'Abonnement'} - {paiement.abonnement?.type}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(paiement.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {getStatusBadge(paiement.statut)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Méthode: {paiement.methode}</p>
                      <p className="text-2xl font-bold mt-2">
                        {formatPrice(paiement.montant)}
                      </p>
                      {paiement.dateValidation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Validé le {new Date(paiement.dateValidation).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    {paiement.statut === 'EN_ATTENTE' && paiement.methode === 'ESPECES' && (
                      <div className="text-sm text-gray-600">
                        En attente de validation par un administrateur
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p>Aucun paiement pour le moment</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/abonnements/plans')}
              >
                Souscrire un abonnement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

