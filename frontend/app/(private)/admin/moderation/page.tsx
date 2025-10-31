'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RatingStars from '@/components/RatingStars';

export default function ModerationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [avis, setAvis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchAvis();
  }, [isAuthenticated, user, router]);

  const fetchAvis = async () => {
    try {
      // Get all prestataireIds and fetch their avis
      const prestatairesRes = await api.get('/prestataires');
      const allAvis: any[] = [];
      
      for (const prestataire of prestatairesRes.data.data || []) {
        try {
          const avisRes = await api.get(`/avis/prestataire/${prestataire.id}`);
          allAvis.push(...(avisRes.data || []));
        } catch (error) {
          // Continue if one fails
        }
      }
      
      setAvis(allAvis.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Modération des Avis</h1>
            <p className="text-gray-600 mt-2">Gestion des avis et signalements</p>
          </div>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            ← Retour au dashboard
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total avis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{avis.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">5 étoiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {avis.filter(a => a.note === 5).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">1-2 étoiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {avis.filter(a => a.note <= 2).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Note moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {avis.length > 0 ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1) : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des avis */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les avis</CardTitle>
            <CardDescription>
              Consultez et modérez les avis laissés par les clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avis.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">⭐</div>
                <div className="text-lg font-medium">Aucun avis pour le moment</div>
                <div className="text-sm mt-2">Les avis apparaîtront ici</div>
              </div>
            ) : (
              <div className="space-y-6">
                {avis.map((avisSingle: any) => (
                  <div key={avisSingle.id} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <RatingStars rating={avisSingle.note} size="sm" />
                          <span className="text-sm text-gray-600">
                            {new Date(avisSingle.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                          Pour: {avisSingle.commande?.prestataire?.raisonSociale || 'Prestataire'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Par: {avisSingle.utilisateur?.phone || avisSingle.utilisateur?.email || 'Anonyme'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          avisSingle.note >= 4 ? 'bg-green-100 text-green-800' :
                          avisSingle.note === 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {avisSingle.note}/5
                        </span>
                      </div>
                    </div>

                    {avisSingle.commentaire && (
                      <div className="mb-4 p-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-800">{avisSingle.commentaire}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        Commande: {avisSingle.commandeId?.substring(0, 8)}...
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Voulez-vous vraiment supprimer cet avis ?')) {
                              // TODO: Implement delete functionality
                              alert('Fonctionnalité de suppression à implémenter');
                            }
                          }}
                        >
                          🗑️ Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>ℹ️ Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Cette page permet de consulter tous les avis laissés par les clients. 
              Vous pouvez supprimer les avis inappropriés ou contenant des contenus offensants.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Attention :</strong> La suppression d'un avis est définitive et affecte la note moyenne du prestataire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

