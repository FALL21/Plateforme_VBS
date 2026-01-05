'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ValidationPrestatairesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const getServiceNames = (prestataire: any): string[] => {
    const fromRelations =
      Array.isArray(prestataire?.prestataireServices)
        ? prestataire.prestataireServices
            .map((ps: any) => ps?.service?.nom)
            .filter((nom: string | undefined): nom is string => !!nom?.trim())
        : [];

    if (fromRelations.length > 0) {
      return Array.from(new Set(fromRelations));
    }

    if (typeof prestataire?.description === 'string') {
      const match = prestataire.description.match(/Services personnalisés ajoutés?\s*:\s*(.+)$/i);
      if (match && match[1]) {
        return Array.from(
          new Set(
            match[1]
              .split(',')
              .map((s: string) => s.trim())
              .filter((value: string) => value.length > 0),
          ),
        );
      }
    }

    return [];
  };

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchPrestataires();
  }, [isAuthenticated, user, router]);

  const fetchPrestataires = async () => {
    try {
      const response = await api.get('/admin/prestataires/pending-kyc');
      setPrestataires(response.data || []);
    } catch (error) {
      console.error('Erreur chargement prestataires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (prestataireId: string, statut: 'VALIDE' | 'REFUSE') => {
    const motif = statut === 'REFUSE' 
      ? prompt('Motif du refus (optionnel):') 
      : undefined;

    if (statut === 'REFUSE' && motif === null) {
      return; // User cancelled
    }

    setProcessing(prestataireId);
    try {
      await api.post(`/admin/prestataires/${prestataireId}/validate-kyc`, {
        statut,
        motif,
      });
      
      alert(`KYC ${statut === 'VALIDE' ? 'validé' : 'refusé'} avec succès !`);
      fetchPrestataires();
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
            <h1 className="text-3xl font-bold text-gray-900">Validation des Prestataires</h1>
            <p className="text-gray-600 mt-2">Vérification KYC et validation des profils</p>
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
              <div className="text-3xl font-bold text-yellow-600">{prestataires.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des prestataires */}
        <Card>
          <CardHeader>
            <CardTitle>Prestataires en attente de validation</CardTitle>
            <CardDescription>
              Vérifiez les informations et validez ou refusez le KYC
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prestataires.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-lg font-medium">Aucun prestataire en attente</div>
                <div className="text-sm mt-2">Tous les KYC sont à jour !</div>
              </div>
            ) : (
              <div className="space-y-6">
                {prestataires.map((prestataire: any) => {
                  const serviceNames = getServiceNames(prestataire);
                  return (
                  <div key={prestataire.id} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl">{prestataire.raisonSociale}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {prestataire.user?.email || prestataire.user?.phone}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {prestataire.kycStatut}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Adresse</p>
                        <p className="font-medium">{prestataire.user?.address || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium">{prestataire.user?.phone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date d'inscription</p>
                        <p className="font-medium">
                          {new Date(prestataire.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Services proposés</p>
                        <p className="font-medium">
                          {serviceNames.length || 0} service(s)
                        </p>
                      </div>
                    </div>

                    {serviceNames.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {serviceNames.map((service: string) => (
                          <span
                            key={service}
                            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                    {prestataire.description && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-sm mt-1">{prestataire.description}</p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleValidation(prestataire.id, 'REFUSE')}
                        disabled={processing === prestataire.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        ❌ Refuser
                      </Button>
                      <Button
                        onClick={() => handleValidation(prestataire.id, 'VALIDE')}
                        disabled={processing === prestataire.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Valider
                      </Button>
                    </div>

                    {processing === prestataire.id && (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Traitement en cours...
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
