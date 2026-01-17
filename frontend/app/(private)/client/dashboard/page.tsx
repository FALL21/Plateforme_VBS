'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastSuccess, toastError } from '@/lib/toast';

const AvisModal = dynamic(() => import('@/components/AvisModal'), { ssr: false });
const NouvelleDemandeModal = dynamic(() => import('@/components/NouvelleDemandeModal'), { ssr: false });

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
  const [commandeToCancel, setCommandeToCancel] = useState<any>(null);
  const [nouvelleDemandeModalOpen, setNouvelleDemandeModalOpen] = useState(false);

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

  const refetchData = async () => {
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

  const handleTerminerCommande = async (commandeId: string) => {
    try {
      await api.patch(`/commandes/${commandeId}/terminer`);
      toastSuccess('Commande terminée', 'Votre commande a été marquée comme terminée.');
      refetchData();
    } catch (error: any) {
      console.error('Erreur terminer commande:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible de terminer la commande. Veuillez réessayer.');
    }
  };

  const handleAnnulerCommande = async () => {
    if (!commandeToCancel) return;
    
    try {
      await api.patch(`/commandes/${commandeToCancel.id}/annuler`);
      toastSuccess('Commande annulée', 'Votre commande a été annulée avec succès.');
      setCommandeToCancel(null);
      refetchData();
    } catch (error: any) {
      console.error('Erreur annulation commande:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible d\'annuler la commande. Veuillez réessayer.');
      setCommandeToCancel(null);
    }
  };

  const handleAvisSuccess = () => {
    refetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-gray-600 font-medium">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* En-tête */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm sm:text-base text-gray-600">Bienvenue</p>
        </div>

        {/* Statistiques avec icônes modernes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Demandes</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{stats.demandes}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">En cours</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">{stats.commandesEnCours}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Terminées</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">{stats.commandesTerminees}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Avis publiés</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600">{stats.avisPublies}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/recherche" className="group">
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      Rechercher un prestataire
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Trouvez le prestataire idéal pour vos besoins</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card 
            className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer group"
            onClick={() => setNouvelleDemandeModalOpen(true)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                    Nouvelle demande
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">Créez une demande de service</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>

          <Link href="/demandes" className="group sm:col-span-2 lg:col-span-1">
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      Mes demandes
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Suivez vos demandes en cours</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dernières demandes */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Dernières demandes</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Vos demandes de service récentes</CardDescription>
              </div>
              {demandes.length > 0 && (
                <Link href="/demandes" className="text-xs sm:text-sm text-primary hover:underline font-medium">
                  Voir tout →
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {demandes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium mb-2">Aucune demande pour le moment</p>
                <button
                  onClick={() => setNouvelleDemandeModalOpen(true)}
                  className="text-xs sm:text-sm text-primary hover:underline font-medium"
                >
                  Créer une demande
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {demandes.slice(0, 5).map((demande: any) => (
                  <div key={demande.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">{demande.service?.nom || 'Service'}</div>
                      <div className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{demande.description}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
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
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Commandes en cours</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Vos services en cours de réalisation</CardDescription>
              </div>
              {commandes.filter((c: any) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)).length > 0 && (
                <Link href="/commandes" className="text-xs sm:text-sm text-primary hover:underline font-medium">
                  Voir tout →
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {commandes.filter((c: any) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut)).length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Aucune commande en cours</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {commandes
                  .filter((c: any) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut))
                  .slice(0, 5)
                  .map((commande: any) => (
                    <div key={commande.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                          {commande.prestataire?.raisonSociale || 'Prestataire'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(commande.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap self-start sm:self-auto ${
                          commande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                          commande.statut === 'ACCEPTEE' ? 'bg-blue-100 text-blue-800' :
                          commande.statut === 'EN_COURS' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {commande.statut}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCommandeToCancel(commande)}
                            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm whitespace-nowrap transition-colors font-medium shadow-sm"
                          >
                            ✕ Annuler
                          </button>
                          <button
                            onClick={() => handleTerminerCommande(commande.id)}
                            className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-xs sm:text-sm whitespace-nowrap font-medium shadow-sm"
                          >
                            ✓ Terminer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes à évaluer */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Commandes à évaluer</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Donnez votre avis sur les services reçus</CardDescription>
              </div>
              {commandes.filter((c: any) => c.statut === 'TERMINEE' && !c.avis).length > 0 && (
                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  {commandes.filter((c: any) => c.statut === 'TERMINEE' && !c.avis).length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {commandes.filter((c: any) => c.statut === 'TERMINEE' && !c.avis).length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Aucune commande à évaluer</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {commandes
                  .filter((c: any) => c.statut === 'TERMINEE' && !c.avis)
                  .slice(0, 5)
                  .map((commande: any) => (
                    <div key={commande.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                          {commande.prestataire?.raisonSociale || 'Prestataire'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Terminée le {new Date(commande.updatedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCommandeForAvis(commande)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap font-medium shadow-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Laisser un avis
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

        {/* Modal nouvelle demande */}
        <NouvelleDemandeModal
          open={nouvelleDemandeModalOpen}
          onOpenChange={setNouvelleDemandeModalOpen}
          onSuccess={refetchData}
        />

        {/* Modal de confirmation d'annulation */}
        {commandeToCancel && (
          <ConfirmDialog
            open={!!commandeToCancel}
            onOpenChange={(open) => !open && setCommandeToCancel(null)}
            title="Annuler la commande"
            description={
              <>
                <div className="space-y-3">
                  <p className="text-base text-gray-700">
                    Êtes-vous sûr de vouloir annuler la commande avec <strong className="text-gray-900">{commandeToCancel.prestataire?.raisonSociale || 'ce prestataire'}</strong> ?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      Cette action est irréversible. La commande et la demande associée seront annulées.
                    </p>
                  </div>
                </div>
              </>
            }
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
            variant="destructive"
            onConfirm={handleAnnulerCommande}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}