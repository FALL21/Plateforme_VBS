'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SecteurDetailPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const secteurId = params.id as string;

  const [secteur, setSecteur] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newSousSecteurNom, setNewSousSecteurNom] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchSecteur();
  }, [isAuthenticated, user, router, secteurId]);

  const fetchSecteur = async () => {
    try {
      const response = await api.get(`/secteurs/${secteurId}`);
      setSecteur(response.data);
    } catch (error) {
      console.error('Erreur chargement secteur:', error);
      alert('Erreur lors du chargement du secteur');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSousSecteur = async () => {
    if (!newSousSecteurNom.trim()) {
      alert('Veuillez entrer un nom de sous-secteur');
      return;
    }

    setCreating(true);
    try {
      await api.post('/secteurs/sous-secteurs', {
        nom: newSousSecteurNom,
        secteurId: secteurId,
      });
      setNewSousSecteurNom('');
      alert('Sous-secteur créé avec succès !');
      fetchSecteur();
    } catch (error: any) {
      console.error('Erreur création sous-secteur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSousSecteur = async (sousSecteurId: string) => {
    if (!editNom.trim()) {
      alert('Veuillez entrer un nom');
      return;
    }

    try {
      await api.put(`/secteurs/sous-secteurs/${sousSecteurId}`, {
        nom: editNom,
      });
      setEditing(null);
      setEditNom('');
      alert('Sous-secteur modifié avec succès !');
      fetchSecteur();
    } catch (error: any) {
      console.error('Erreur modification:', error);
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteSousSecteur = async (sousSecteurId: string, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le sous-secteur "${nom}" ?`)) {
      return;
    }

    try {
      await api.delete(`/secteurs/sous-secteurs/${sousSecteurId}`);
      alert('Sous-secteur supprimé avec succès !');
      fetchSecteur();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleUpdateSecteur = async () => {
    const newNom = prompt('Nouveau nom du secteur:', secteur?.nom);
    if (!newNom || newNom === secteur?.nom) return;

    try {
      await api.put(`/secteurs/${secteurId}`, { nom: newNom });
      alert('Secteur modifié avec succès !');
      fetchSecteur();
    } catch (error: any) {
      console.error('Erreur modification secteur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteSecteur = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le secteur "${secteur?.nom}" et tous ses sous-secteurs ?`)) {
      return;
    }

    try {
      await api.delete(`/secteurs/${secteurId}`);
      alert('Secteur supprimé avec succès !');
      router.push('/admin/secteurs');
    } catch (error: any) {
      console.error('Erreur suppression secteur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!secteur) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Secteur non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{secteur.nom}</h1>
            <p className="text-gray-600 mt-2">Gestion du secteur et de ses sous-secteurs</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/admin/secteurs')} variant="outline">
              ← Retour
            </Button>
            <Button onClick={handleUpdateSecteur} variant="outline">
              ✏️ Modifier
            </Button>
            <Button onClick={handleDeleteSecteur} variant="outline" className="text-red-600 border-red-300">
              🗑️ Supprimer
            </Button>
          </div>
        </div>

        {/* Info secteur */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom du secteur</p>
                <p className="font-medium text-lg">{secteur.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID</p>
                <p className="font-mono text-sm">{secteur.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre de sous-secteurs</p>
                <p className="font-medium">{secteur.sousSecteurs?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  secteur.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {secteur.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Création de sous-secteur */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Créer un nouveau sous-secteur</CardTitle>
            <CardDescription>Ajoutez un sous-secteur dans "{secteur.nom}"</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Nom du sous-secteur (ex: Alimentaire, Ménage...)"
                value={newSousSecteurNom}
                onChange={(e) => setNewSousSecteurNom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSousSecteur()}
                className="flex-1"
              />
              <Button onClick={handleCreateSousSecteur} disabled={creating}>
                {creating ? 'Création...' : '+ Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des sous-secteurs */}
        <Card>
          <CardHeader>
            <CardTitle>Sous-secteurs ({secteur.sousSecteurs?.length || 0})</CardTitle>
            <CardDescription>Liste des sous-secteurs de "{secteur.nom}"</CardDescription>
          </CardHeader>
          <CardContent>
            {!secteur.sousSecteurs || secteur.sousSecteurs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun sous-secteur trouvé. Créez-en un ci-dessus.
              </div>
            ) : (
              <div className="space-y-4">
                {secteur.sousSecteurs.map((sousSecteur: any) => (
                  <div key={sousSecteur.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    {editing === sousSecteur.id ? (
                      <div className="flex gap-3">
                        <Input
                          value={editNom}
                          onChange={(e) => setEditNom(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateSousSecteur(sousSecteur.id)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateSousSecteur(sousSecteur.id)}>
                          ✅ Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(null);
                            setEditNom('');
                          }}
                        >
                          ❌ Annuler
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{sousSecteur.nom}</h3>
                          <p className="text-sm text-gray-600 mt-1">ID: {sousSecteur.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(sousSecteur.id);
                              setEditNom(sousSecteur.nom);
                            }}
                          >
                            ✏️ Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300"
                            onClick={() => handleDeleteSousSecteur(sousSecteur.id, sousSecteur.nom)}
                          >
                            🗑️ Supprimer
                          </Button>
                        </div>
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

