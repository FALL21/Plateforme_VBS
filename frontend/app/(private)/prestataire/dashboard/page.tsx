'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function PrestataireDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [prestataire, setPrestataire] = useState<any>(null);
  const [abonnement, setAbonnement] = useState<any>(null);
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

        // Récupérer l'abonnement actif
        try {
          const abonnementRes = await api.get('/abonnements/me');
          setAbonnement(abonnementRes.data ?? null);
        } catch {
          setAbonnement(null);
        }

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

  const abonnementActif = useMemo(() => {
    if (!abonnement) return null;
    return {
      nom: abonnement?.plan?.nom || (abonnement.type === 'ANNUEL' ? 'Abonnement Annuel' : 'Abonnement Mensuel'),
      type: abonnement.type,
      dateDebut: abonnement.dateDebut ? new Date(abonnement.dateDebut) : null,
      dateFin: abonnement.dateFin ? new Date(abonnement.dateFin) : null,
      statut: abonnement.statut,
      tarif: abonnement.tarif,
    };
  }, [abonnement]);

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
        {/* En-tête avec disponibilité */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">{prestataire?.raisonSociale}</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Disponibilité</span>
            <button
              onClick={toggleDisponibilite}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 flex-shrink-0 ${
                prestataire?.disponibilite ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-300'
              }`}
              aria-label="Toggle disponibilité"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  prestataire?.disponibilite ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs font-medium ${prestataire?.disponibilite ? 'text-green-600' : 'text-gray-500'}`}>
              {prestataire?.disponibilite ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Statut abonnement */}
        {!abonnementActif ? (
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-900 text-base sm:text-lg mb-1">Abonnement inactif</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Votre profil n&apos;est pas visible sur la plateforme.
                  </p>
                  <Link 
                    href="/abonnements/plans" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    Souscrire un abonnement
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : abonnementActif.statut === 'EN_ATTENTE' ? (
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50/50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-yellow-900 text-base sm:text-lg mb-1">Abonnement en attente</h3>
                  <p className="text-sm text-yellow-700">
                    Votre demande d&apos;abonnement est en cours de traitement par un administrateur.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50/50 shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-gray-900 mb-1">Mon abonnement actuel</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Visible jusqu&apos;au {abonnementActif.dateFin?.toLocaleDateString('fr-FR') || '—'}
                  </CardDescription>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-full text-xs sm:text-sm font-semibold shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {abonnementActif.statut}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{abonnementActif.nom}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Période</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {abonnementActif.dateDebut?.toLocaleDateString('fr-FR') || '—'} → {abonnementActif.dateFin?.toLocaleDateString('fr-FR') || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Montant</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {abonnementActif.tarif ? `${abonnementActif.tarif.toLocaleString('fr-FR')} FCFA` : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques avec icônes modernes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Demandes reçues</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{stats.demandesRecues}</p>
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

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
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
        </div>

        {/* Réputation et Statut KYC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Réputation</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Votre note moyenne et avis clients</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="text-4xl sm:text-5xl font-bold text-yellow-600">{stats.noteMoyenne.toFixed(1)}</div>
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          star <= Math.round(stats.noteMoyenne) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">{stats.nombreAvis} avis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Statut KYC</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Vérification de votre profil</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  prestataire?.kycStatut === 'VALIDE' ? 'bg-green-100' :
                  prestataire?.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {prestataire?.kycStatut === 'VALIDE' ? (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : prestataire?.kycStatut === 'EN_ATTENTE' ? (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${
                    prestataire?.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                    prestataire?.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {prestataire?.kycStatut || 'NON_SOUMIS'}
                  </span>
                  {prestataire?.kycStatut !== 'VALIDE' && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">
                      <Link href="/prestataire/kyc" className="text-primary hover:underline font-medium">
                        Compléter la vérification →
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/prestataire/profile/edit" className="group">
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      Gérer mon profil
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Modifier vos informations et services</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/abonnements/plans" className="group">
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      Mon abonnement
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Gérer votre abonnement et paiements</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/prestataire/reports" className="group">
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      Rapports de services
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">Statistiques et analyses de vos prestations</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Nouvelles demandes */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Nouvelles demandes</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">Demandes de service reçues</CardDescription>
              </div>
              {demandes.filter((d: any) => d.statut === 'EN_ATTENTE').length > 0 && (
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {demandes.filter((d: any) => d.statut === 'EN_ATTENTE').length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {demandes.filter((d: any) => d.statut === 'EN_ATTENTE').length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Aucune nouvelle demande</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Les nouvelles demandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {demandes
                  .filter((d: any) => d.statut === 'EN_ATTENTE')
                  .slice(0, 5)
                  .map((demande: any) => (
                    <div key={demande.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">{demande.service?.nom || 'Service'}</div>
                        <div className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{demande.description}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {demande.utilisateur?.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm">
                          Accepter
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm">
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