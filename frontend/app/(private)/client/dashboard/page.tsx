'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const AvisModal = dynamic(() => import('@/components/AvisModal'), { ssr: false });

export default function ClientDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    demandes: 0,
    commandesEnCours: 0,
    commandesTerminees: 0,
    avisPublies: 0,
  });
  const [demandes, setDemandes] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommandeForAvis, setSelectedCommandeForAvis] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'USER') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Récupérer les demandes
        const demandesRes = await api.get('/demandes/mes-demandes');
        setDemandes(demandesRes.data || []);

        // Récupérer les commandes
        const commandesRes = await api.get('/commandes/mes-commandes');
        setCommandes(commandesRes.data || []);

        // Calculer les stats
        const commandesEnCours = commandesRes.data.filter((c: any) => 
          ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)
        ).length;
        const commandesTerminees = commandesRes.data.filter((c: any) => 
          c.statut === 'TERMINEE'
        ).length;

        setStats({
          demandes: demandesRes.data.length,
          commandesEnCours,
          commandesTerminees,
          avisPublies: commandesRes.data.filter((c: any) => c.avis).length,
        });
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  const handleTerminerCommande = async (commandeId: string) => {
    try {
      await api.patch(`/commandes/${commandeId}/terminer`);
      alert('Commande marquée comme terminée !');
      
      // Recharger les données
      const fetchData = async () => {
        try {
          const demandesRes = await api.get('/demandes/mes-demandes');
          setDemandes(demandesRes.data || []);

          const commandesRes = await api.get('/commandes/mes-commandes');
          setCommandes(commandesRes.data || []);

          const commandesEnCours = commandesRes.data.filter((c: any) => 
            ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)
          ).length;
          const commandesTerminees = commandesRes.data.filter((c: any) => 
            c.statut === 'TERMINEE'
          ).length;

          setStats({
            demandes: demandesRes.data.length,
            commandesEnCours,
            commandesTerminees,
            avisPublies: commandesRes.data.filter((c: any) => c.avis).length,
          });
        } catch (error) {
          console.error('Erreur chargement données:', error);
        }
      };
      fetchData();
    } catch (error: any) {
      console.error('Erreur terminer commande:', error);
      alert(error.response?.data?.message || 'Erreur lors de la terminaison de la commande');
    }
  };

  const handleAvisSuccess = () => {
    // Recharger les données après avoir laissé un avis
    const fetchData = async () => {
      try {
        const demandesRes = await api.get('/demandes/mes-demandes');
        setDemandes(demandesRes.data || []);

        const commandesRes = await api.get('/commandes/mes-commandes');
        setCommandes(commandesRes.data || []);

        const commandesEnCours = commandesRes.data.filter((c: any) => 
          ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)
        ).length;
        const commandesTerminees = commandesRes.data.filter((c: any) => 
          c.statut === 'TERMINEE'
        ).length;

        setStats({
          demandes: demandesRes.data.length,
          commandesEnCours,
          commandesTerminees,
          avisPublies: commandesRes.data.filter((c: any) => c.avis).length,
        });
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };
    fetchData();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Client</h1>
          <p className="text-gray-600 mt-2">Bienvenue {user?.phone}</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.demandes}</div>
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
              <CardTitle className="text-sm font-medium text-gray-600">Avis publiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.avisPublies}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/recherche">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Rechercher un prestataire
                </CardTitle>
                <CardDescription>
                  Trouvez le prestataire idéal pour vos besoins
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/demandes/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ➕ Nouvelle demande
                </CardTitle>
                <CardDescription>
                  Créez une demande de service
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/demandes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Mes demandes
                </CardTitle>
                <CardDescription>
                  Suivez vos demandes en cours
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Dernières demandes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dernières demandes</CardTitle>
            <CardDescription>Vos demandes de service récentes</CardDescription>
          </CardHeader>
          <CardContent>
            {demandes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune demande pour le moment. 
                <Link href="/demandes/new" className="text-primary hover:underline ml-1">
                  Créer une demande
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {demandes.slice(0, 5).map((demande: any) => (
                  <div key={demande.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{demande.service?.nom || 'Service'}</div>
                      <div className="text-sm text-gray-600">{demande.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      demande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                      demande.statut === 'ACCEPTEE' ? 'bg-green-100 text-green-800' :
                      demande.statut === 'REFUSEE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {demande.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes en cours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Commandes en cours</CardTitle>
            <CardDescription>Vos services en cours de réalisation</CardDescription>
          </CardHeader>
          <CardContent>
            {commandes.filter((c: any) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune commande en cours
              </div>
            ) : (
              <div className="space-y-4">
                {commandes
                  .filter((c: any) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut))
                  .slice(0, 5)
                  .map((commande: any) => (
                    <div key={commande.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {commande.prestataire?.raisonSociale || 'Prestataire'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {commande.prix?.toLocaleString('fr-FR')} FCFA
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(commande.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          commande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                          commande.statut === 'ACCEPTEE' ? 'bg-blue-100 text-blue-800' :
                          commande.statut === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {commande.statut}
                        </span>
                        <button
                          onClick={() => handleTerminerCommande(commande.id)}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 text-sm"
                        >
                          ✓ Terminer
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes terminées à évaluer */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes à évaluer</CardTitle>
            <CardDescription>Donnez votre avis sur les services reçus</CardDescription>
          </CardHeader>
          <CardContent>
            {commandes.filter((c: any) => c.statut === 'TERMINEE' && !c.avis).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune commande à évaluer
              </div>
            ) : (
              <div className="space-y-4">
                {commandes
                  .filter((c: any) => c.statut === 'TERMINEE' && !c.avis)
                  .slice(0, 5)
                  .map((commande: any) => (
                    <div key={commande.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {commande.prestataire?.raisonSociale || 'Prestataire'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {commande.prix?.toLocaleString('fr-FR')} FCFA
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Terminée le {new Date(commande.updatedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCommandeForAvis(commande)}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 text-sm flex items-center gap-2"
                      >
                        ⭐ Laisser un avis
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal d'avis */}
        {selectedCommandeForAvis && (
          <AvisModal
            commande={selectedCommandeForAvis}
            onClose={() => setSelectedCommandeForAvis(null)}
            onSuccess={handleAvisSuccess}
          />
        )}
      </div>
    </div>
  );
}

