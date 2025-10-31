'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SecteursManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSecteurNom, setNewSecteurNom] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchSecteurs();
  }, [isAuthenticated, user, router]);

  const fetchSecteurs = async () => {
    try {
      const response = await api.get('/secteurs');
      setSecteurs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement secteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecteur = async () => {
    if (!newSecteurNom.trim()) {
      alert('Veuillez entrer un nom de secteur');
      return;
    }

    setCreating(true);
    try {
      await api.post('/secteurs', { nom: newSecteurNom });
      setNewSecteurNom('');
      alert('Secteur créé avec succès !');
      fetchSecteurs();
    } catch (error: any) {
      console.error('Erreur création secteur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Secteurs</h1>
            <p className="text-gray-600 mt-2">Taxonomie: secteurs, sous-secteurs et services</p>
          </div>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            ← Retour au dashboard
          </Button>
        </div>

        {/* Création de secteur */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer un nouveau secteur</CardTitle>
            <CardDescription>Ajoutez un secteur d'activité principal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Nom du secteur (ex: Vente, Services généraux...)"
                value={newSecteurNom}
                onChange={(e) => setNewSecteurNom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSecteur()}
                className="flex-1"
              />
              <Button onClick={handleCreateSecteur} disabled={creating}>
                {creating ? 'Création...' : '+ Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des secteurs */}
        <Card>
          <CardHeader>
            <CardTitle>Secteurs existants ({secteurs.length})</CardTitle>
            <CardDescription>Liste complète des secteurs d'activité</CardDescription>
          </CardHeader>
          <CardContent>
            {secteurs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun secteur trouvé. Créez-en un ci-dessus.
              </div>
            ) : (
              <div className="space-y-4">
                {secteurs.map((secteur: any) => (
                  <div key={secteur.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{secteur.nom}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          ID: {secteur.id}
                        </p>
                        <div className="mt-2 flex gap-4 text-sm text-gray-500">
                          <span>📋 {secteur.sousSecteurs?.length || 0} sous-secteurs</span>
                          <span>🔧 Services associés</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/admin/secteurs/${secteur.id}`)}
                        >
                          Gérer
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
              Les secteurs permettent d'organiser les services proposés sur la plateforme.
              Chaque secteur peut contenir plusieurs sous-secteurs, qui eux-mêmes contiennent des services spécifiques.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Exemple :</strong> Secteur "Vente" → Sous-secteur "Alimentaire" → Service "Produits alimentaires"
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

