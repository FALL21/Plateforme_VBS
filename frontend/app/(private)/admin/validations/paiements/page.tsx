'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ValidationPaiementsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchPaiements();
  }, [isAuthenticated, user, router]);

  const fetchPaiements = async () => {
    try {
      const response = await api.get('/admin/paiements/pending');
      setPaiements(response.data || []);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (paiementId: string, statut: 'VALIDE' | 'REFUSE') => {
    const motif = statut === 'REFUSE' 
      ? prompt('Motif du refus (optionnel):') 
      : undefined;

    if (statut === 'REFUSE' && motif === null) {
      return; // User cancelled
    }

    setProcessing(paiementId);
    try {
      await api.post(`/admin/paiements/${paiementId}/validate`, {
        statut,
        motif,
      });
      
      alert(`Paiement ${statut === 'VALIDE' ? 'validé' : 'refusé'} avec succès !`);
      fetchPaiements();
    } catch (error: any) {
      console.error('Erreur validation:', error);
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setProcessing(null);
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
            <h1 className="text-3xl font-bold text-gray-900">Validation des Paiements</h1>
            <p className="text-gray-600 mt-2">Paiements en espèces à confirmer</p>
          </div>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            ← Retour au dashboard
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{paiements.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Montant total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {paiements.reduce((sum, p) => sum + (p.montant || 0), 0).toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des paiements */}
        <Card>
          <CardHeader>
            <CardTitle>Paiements en attente de validation</CardTitle>
            <CardDescription>
              Vérifiez les paiements en espèces et confirmez ou refusez
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paiements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">💰</div>
                <div className="text-lg font-medium">Aucun paiement en attente</div>
                <div className="text-sm mt-2">Tous les paiements sont validés !</div>
              </div>
            ) : (
              <div className="space-y-6">
                {paiements.map((paiement: any) => (
                  <div key={paiement.id} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl">
                          {paiement.abonnement?.prestataire?.raisonSociale || 'Prestataire'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {paiement.abonnement?.prestataire?.user?.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {paiement.montant?.toLocaleString('fr-FR')} FCFA
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 inline-block mt-2">
                          {paiement.statut}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Méthode de paiement</p>
                        <p className="font-medium capitalize">{paiement.methodePaiement?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date de paiement</p>
                        <p className="font-medium">
                          {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {paiement.abonnement && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Plan d'abonnement</p>
                            <p className="font-medium">{paiement.abonnement.plan?.nom || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Durée</p>
                            <p className="font-medium">
                              {new Date(paiement.abonnement.dateDebut).toLocaleDateString('fr-FR')} 
                              {' → '}
                              {new Date(paiement.abonnement.dateFin).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {paiement.referenceTransaction && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Référence de transaction</p>
                        <p className="text-sm font-mono mt-1">{paiement.referenceTransaction}</p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleValidation(paiement.id, 'REFUSE')}
                        disabled={processing === paiement.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        ❌ Refuser
                      </Button>
                      <Button
                        onClick={() => handleValidation(paiement.id, 'VALIDE')}
                        disabled={processing === paiement.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Valider
                      </Button>
                    </div>

                    {processing === paiement.id && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Traitement en cours...
                      </div>
                    )}
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
