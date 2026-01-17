'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';

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
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-gray-500 text-sm sm:text-base">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Bouton retour */}
        <div>
          <BackButton href="/prestataire/dashboard" label="Retour au dashboard" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historique des paiements</h1>
          <Button 
            onClick={() => router.push('/abonnements/plans')}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Nouveau paiement
          </Button>
        </div>

        {paiements.length > 0 ? (
          <div className="space-y-4">
            {paiements.map((paiement) => (
              <Card key={paiement.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg text-gray-900 break-words">
                        {paiement.abonnement?.plan?.nom || 'Abonnement'} - {paiement.abonnement?.type}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {new Date(paiement.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(paiement.statut)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Méthode: {paiement.methode}</p>
                      <p className="text-xl sm:text-2xl font-bold mt-2 text-gray-900">
                        {formatPrice(paiement.montant)}
                      </p>
                      {paiement.dateValidation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Validé le {new Date(paiement.dateValidation).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    {paiement.statut === 'EN_ATTENTE' && paiement.methode === 'ESPECES' && (
                      <div className="text-xs sm:text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
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
            <CardContent className="py-8 sm:py-12 text-center text-gray-500 p-4 sm:p-6">
              <p className="text-sm sm:text-base mb-4">Aucun paiement pour le moment</p>
              <Button
                className="w-full sm:w-auto"
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

