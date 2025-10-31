'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UserDetailPage() {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || currentUser?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUserDetails();
  }, [isAuthenticated, currentUser, router, userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Erreur chargement détails utilisateur:', error);
      alert('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'PRESTATAIRE': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑 Admin';
      case 'PRESTATAIRE': return '🏢 Prestataire';
      case 'USER': return '👤 Client';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Utilisateur non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Détails Utilisateur</h1>
            <p className="text-gray-600 mt-2">Informations complètes du compte</p>
          </div>
          <Button onClick={() => router.push('/admin/users')} variant="outline">
            ← Retour à la liste
          </Button>
        </div>

        {/* Informations principales */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations générales</CardTitle>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">ID</p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut du compte</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                  user.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.actif ? '✓ Actif' : '✗ Désactivé'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{user.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="font-medium">{user.address || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Inscription</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dernière modification</p>
                <p className="font-medium">
                  {new Date(user.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations Prestataire */}
        {user.role === 'PRESTATAIRE' && user.prestataire && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Profil Prestataire</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Raison sociale</p>
                    <p className="font-medium text-lg">{user.prestataire.raisonSociale}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut KYC</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.prestataire.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                      user.prestataire.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.prestataire.kycStatut}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Disponibilité</p>
                    <p className="font-medium">{user.prestataire.disponible ? 'Disponible' : 'Non disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Note globale</p>
                    <p className="font-medium text-lg">⭐ {user.prestataire.noteGlobale || 0}/5</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nombre de services</p>
                    <p className="font-medium">{user.prestataire.nombreServices || 0}</p>
                  </div>
                </div>

                {user.prestataire.services && user.prestataire.services.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Services proposés ({user.prestataire.services.length})</h3>
                    <div className="space-y-2">
                      {user.prestataire.services.slice(0, 5).map((service: any) => (
                        <div key={service.id} className="p-3 bg-gray-50 rounded">
                          <p className="font-medium">{service.nom}</p>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <p className="text-sm mt-1">
                            Prix: {service.prix} {service.unitePrix} • 
                            {service.actif ? ' Actif' : ' Inactif'}
                          </p>
                        </div>
                      ))}
                      {user.prestataire.services.length > 5 && (
                        <p className="text-sm text-gray-500">
                          ... et {user.prestataire.services.length - 5} autre(s) service(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {user.prestataire.abonnements && user.prestataire.abonnements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Abonnements récents</h3>
                    <div className="space-y-2">
                      {user.prestataire.abonnements.map((abo: any) => (
                        <div key={abo.id} className="p-3 bg-blue-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{abo.plan?.nom}</p>
                              <p className="text-sm text-gray-600">
                                Du {new Date(abo.dateDebut).toLocaleDateString('fr-FR')} 
                                {' au '}
                                {new Date(abo.dateFin).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              abo.statut === 'ACTIF' ? 'bg-green-100 text-green-800' :
                              abo.statut === 'EXPIRE' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {abo.statut}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Demandes (pour les clients) */}
        {user.demandes && user.demandes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demandes récentes ({user.demandes.length})</CardTitle>
              <CardDescription>Dernières demandes effectuées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.demandes.map((demande: any) => (
                  <div key={demande.id} className="p-3 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{demande.description}</p>
                        <p className="text-sm text-gray-600">
                          Prestataire: {demande.prestataire?.raisonSociale || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        demande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        demande.statut === 'ACCEPTEE' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {demande.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

