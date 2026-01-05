'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
export const dynamic = 'force-dynamic';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const planId = searchParams.get('planId');

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select-plan' | 'payment'>('select-plan');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planId);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'ESPECES' | null>(null);
  const [justificatifUrl, setJustificatifUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchPlans = async () => {
      try {
        const response = await api.get('/abonnements/plans');
        setPlans(response.data || []);
        if (planId) {
          const plan = response.data.find((p: any) => p.id === planId);
          if (plan) {
            setSelectedPlan(plan);
            setStep('payment');
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchPlans();
  }, [isAuthenticated, router, planId]);

  const handleCreateAbonnement = async () => {
    if (!selectedPlanId) {
      alert('Veuillez sélectionner un plan');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/abonnements', {
        planId: selectedPlanId,
        type: selectedPlan.type,
      });

      const abonnementId = response.data.id;

      // Gérer le paiement selon la méthode choisie
      if (paymentMethod === 'WAVE') {
        const paymentRes = await api.post('/paiements/wave/initier', {
          abonnementId,
          montant: selectedPlan.prix,
        });
        if (paymentRes?.data) {
          alert('Veuillez valider votre paiement Wave via le numéro 776806767. Un administrateur confirmera votre abonnement sous peu.');
        } else {
          alert('Votre demande de paiement Wave a été enregistrée. Veuillez valider le transfert au numéro 776806767. Un administrateur confirmera votre abonnement sous peu.');
        }
        router.push('/prestataire');
      } else if (paymentMethod === 'ESPECES') {
        await api.post('/paiements/especes', {
          abonnementId,
          montant: selectedPlan.prix,
          justificatifUrl,
        });
        alert('Un agent de VBS va bientôt récupérer votre paiement. Un administrateur confirmera votre abonnement une fois le montant reçu.');
        router.push('/prestataire');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la souscription');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'select-plan') {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Souscrire un abonnement</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlanId === plan.id
                    ? 'border-primary border-2'
                    : ''
                }`}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setSelectedPlan(plan);
                }}
              >
                <CardHeader>
                  <CardTitle>{plan.nom}</CardTitle>
                  <CardDescription>{plan.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {plan.prix.toLocaleString()} FCFA
                  </div>
                  {selectedPlanId === plan.id && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => setStep('payment')}
                    >
                      Continuer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Paiement de l'abonnement</CardTitle>
            <CardDescription>
              Plan {selectedPlan?.nom} - {selectedPlan?.prix.toLocaleString()} FCFA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Méthode de paiement</h3>
              <div className="space-y-2">
                <Button
                  variant={paymentMethod === 'WAVE' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setPaymentMethod('WAVE')}
                >
                  Wave
                </Button>
                <Button
                  variant={paymentMethod === 'ESPECES' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setPaymentMethod('ESPECES')}
                >
                  Espèces (à valider par admin)
                </Button>
              </div>
            </div>

            {paymentMethod === 'WAVE' && (
              <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-md p-4">
                Envoyez le montant de l’abonnement au numéro <strong>776&nbsp;806&nbsp;767</strong> via Wave. Votre souscription restera en attente jusqu’à validation par un administrateur.
              </div>
            )}

            {paymentMethod === 'ESPECES' && (
              <div>
                <label className="block mb-2">URL du justificatif</label>
                <Input
                  placeholder="https://..."
                  value={justificatifUrl}
                  onChange={(e) => setJustificatifUrl(e.target.value)}
                />
                <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-3">
                  Un agent VBS prendra contact pour récupérer le paiement en espèces. L’abonnement sera activé après validation administrative.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('select-plan')}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                onClick={handleCreateAbonnement}
                disabled={loading || !paymentMethod}
                className="flex-1"
              >
                {loading ? 'Traitement...' : 'Confirmer le paiement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SouscrireAbonnementPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <Content />
    </Suspense>
  );
}

