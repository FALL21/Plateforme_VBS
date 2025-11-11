'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrestataireDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [prestataire, setPrestataire] = useState<any>(null);
  const [stats, setStats] = useState({
    demandesRecues: 0,
    commandesEnCours: 0,
    commandesTerminees: 0,
    chiffreAffaire: 0,
    noteMoyenne: 0,
    nombreAvis: 0,
  });
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'PRESTATAIRE') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Récupérer le profil prestataire
        const prestataireRes = await api.get('/prestataires/mon-profil');
        setPrestataire(prestataireRes.data);

        // Récupérer les demandes reçues
        const demandesRes = await api.get('/demandes/recues');
        setDemandes(demandesRes.data || []);

        // Récupérer les commandes
        const commandesRes = await api.get('/commandes/mes-commandes-prestataire');
        const commandes = commandesRes.data || [];

        // Calculer les stats
        const commandesEnCours = commandes.filter((c: any) => 
          ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)
        ).length;
        const commandesTerminees = commandes.filter((c: any) => 
          c.statut === 'TERMINEE'
        ).length;
        const chiffreAffaire = commandes
          .filter((c: any) => c.statut === 'TERMINEE')
          .reduce((sum: number, c: any) => sum + (c.prix || 0), 0);

        setStats({
          demandesRecues: demandesRes.data.length,
          commandesEnCours,
          commandesTerminees,
          chiffreAffaire,
          noteMoyenne: prestataireRes.data.noteMoyenne || 0,
          nombreAvis: prestataireRes.data.nombreAvis || 0,
        });
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  const toggleDisponibilite = async () => {
    try {
      await api.patch('/prestataires/disponibilite', {
        disponibilite: !prestataire.disponibilite,
      });
      setPrestataire({ ...prestataire, disponibilite: !prestataire.disponibilite });
    } catch (error) {
      console.error('Erreur mise à jour disponibilité:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Prestataire</h1>
            <p className="text-gray-600 mt-2">{prestataire?.raisonSociale}</p>
          </div>
          
          {/* Toggle disponibilité */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Disponibilité</span>
            <button
              onClick={toggleDisponibilite}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                prestataire?.disponibilite ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  prestataire?.disponibilite ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Alerte abonnement */}
        {!prestataire?.abonnementActif && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <div>
                <div className="font-medium text-red-900">Abonnement inactif</div>
                <div className="text-sm text-red-700">
                  Votre profil n&apos;est pas visible. 
                  <Link href="/abonnements/plans" className="underline ml-1">
                    Souscrire un abonnement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Demandes reçues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.demandesRecues}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.commandesEnCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Terminées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.commandesTerminees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Chiffre d&apos;affaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.chiffreAffaire.toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Réputation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Réputation</CardTitle>
              <CardDescription>Votre note moyenne et avis clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-yellow-600">
                  {stats.noteMoyenne.toFixed(1)}
                </div>
                <div>
                  <div className="text-yellow-500 text-2xl">★★★★★</div>
                  <div className="text-sm text-gray-600">{stats.nombreAvis} avis</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut KYC</CardTitle>
              <CardDescription>Vérification de votre profil</CardDescription>
            </CardHeader>
            <CardContent>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                prestataire?.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                prestataire?.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {prestataire?.kycStatut || 'NON_SOUMIS'}
              </span>
              {prestataire?.kycStatut !== 'VALIDE' && (
                <div className="mt-2 text-sm text-gray-600">
                  <Link href="/prestataire/kyc" className="text-primary hover:underline">
                    Compléter la vérification
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/prestataire/profile/edit">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Gérer mon profil
                </CardTitle>
                <CardDescription>
                  Modifier vos informations et services
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/abonnements/plans">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Mon abonnement
                </CardTitle>
                <CardDescription>
                  Gérer votre abonnement et paiements
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/commandes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📦 Mes commandes
                </CardTitle>
                <CardDescription>
                  Consulter toutes vos commandes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Nouvelles demandes */}
        <Card>
          <CardHeader>
            <CardTitle>Nouvelles demandes</CardTitle>
            <CardDescription>Demandes de service reçues</CardDescription>
          </CardHeader>
          <CardContent>
            {demandes.filter((d: any) => d.statut === 'EN_ATTENTE').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune nouvelle demande
              </div>
            ) : (
              <div className="space-y-4">
                {demandes
                  .filter((d: any) => d.statut === 'EN_ATTENTE')
                  .slice(0, 5)
                  .map((demande: any) => (
                    <div key={demande.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{demande.service?.nom || 'Service'}</div>
                        <div className="text-sm text-gray-600">{demande.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Client: {demande.utilisateur?.phone} • {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                          Accepter
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                          Refuser
                        </button>
                      </div>
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

