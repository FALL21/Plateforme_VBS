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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Modération des Avis</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Gestion des avis et signalements</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/dashboard')} 
            variant="outline"
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            ← Retour au dashboard
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total avis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">{avis.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">5 étoiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                {avis.filter(a => a.note === 5).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">1-2 étoiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                {avis.filter(a => a.note <= 2).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Note moyenne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">
                {avis.length > 0 ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1) : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des avis */}
        <Card className="border-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Tous les avis</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Consultez et modérez les avis laissés par les clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avis.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⭐</div>
                <div className="text-base sm:text-lg font-medium">Aucun avis pour le moment</div>
                <div className="text-xs sm:text-sm mt-2">Les avis apparaîtront ici</div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {avis.map((avisSingle: any) => (
                  <div key={avisSingle.id} className="p-4 sm:p-6 border-2 rounded-lg hover:shadow-lg transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <RatingStars rating={avisSingle.note} size="sm" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {new Date(avisSingle.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-1 break-words">
                          Pour: {avisSingle.commande?.prestataire?.raisonSociale || 'Prestataire'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          Par: {avisSingle.utilisateur?.phone || avisSingle.utilisateur?.email || 'Anonyme'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          avisSingle.note >= 4 ? 'bg-green-100 text-green-800' :
                          avisSingle.note === 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {avisSingle.note}/5
                        </span>
                      </div>
                    </div>

                    {avisSingle.commentaire && (
                      <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded">
                        <p className="text-xs sm:text-sm text-gray-800 break-words">{avisSingle.commentaire}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs text-gray-500">
                      <div className="break-all">
                        Commande: {avisSingle.commandeId?.substring(0, 8)}...
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 h-8 sm:h-9 text-xs"
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
        <Card className="mt-6 sm:mt-8 border-2">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">ℹ️ Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600">
              Cette page permet de consulter tous les avis laissés par les clients. 
              Vous pouvez supprimer les avis inappropriés ou contenant des contenus offensants.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              <strong>Attention :</strong> La suppression d'un avis est définitive et affecte la note moyenne du prestataire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

