'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/BackButton';

function AvisForm() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const commandeId = searchParams.get('commandeId');

  const [commande, setCommande] = useState<any>(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'USER') {
      router.push('/login');
      return;
    }

    if (!commandeId) {
      router.push('/client/dashboard');
      return;
    }

    const fetchCommande = async () => {
      try {
        const response = await api.get(`/commandes/${commandeId}`);
        setCommande(response.data);
      } catch (error) {
        console.error('Erreur chargement commande:', error);
        setError('Commande non trouvée');
      } finally {
        setLoading(false);
      }
    };

    fetchCommande();
  }, [isAuthenticated, user, router, commandeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/avis', {
        commandeId: commande.id,
        prestataireId: commande.prestataireId,
        note,
        commentaire,
      });

      alert('Merci pour votre avis !');
      router.push('/client/dashboard');
    } catch (error: any) {
      console.error('Erreur création avis:', error);
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error && !commande) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-8">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Bouton retour */}
        <div>
          <BackButton href="/client/dashboard" label="Retour au dashboard" />
        </div>
        
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Donner votre avis</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Partagez votre expérience avec {commande?.prestataire?.raisonSociale}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Informations de la commande */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                {commande?.prestataire?.logoUrl && (
                  <img
                    src={(() => {
                      const raw = commande.prestataire.logoUrl as string;
                      const base = raw.startsWith('/api')
                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${raw}`
                        : raw;
                      return `${base}${base.includes('?') ? '&' : '?'}v=${Date.now()}`;
                    })()}
                    alt={commande.prestataire.raisonSociale}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                  />
                )}
                <div>
                  <div className="font-medium text-lg">
                    {commande?.prestataire?.raisonSociale}
                  </div>
                  <div className="text-sm text-gray-600">
                    Service: {commande?.demande?.service?.nom}
                  </div>
                  <div className="text-sm text-gray-600">
                    Montant: {commande?.prix?.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNote(star)}
                      className={`text-4xl transition-colors ${
                        star <= note ? 'text-yellow-500' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-4 text-lg font-medium text-gray-700">
                    {note}/5
                  </span>
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre commentaire <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="commentaire"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Partagez votre expérience avec ce prestataire..."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !commentaire.trim()}
                  className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submitting ? 'Publication...' : 'Publier mon avis'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewAvisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Chargement...</div></div>}>
      <AvisForm />
    </Suspense>
  );
}

