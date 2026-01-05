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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord Prestataire</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base truncate">{prestataire?.raisonSociale}</p>
          </div>
          
          {/* Toggle disponibilité */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-sm text-gray-600 whitespace-nowrap">Disponibilité</span>
            <button
              onClick={toggleDisponibilite}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
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

        {/* Statut abonnement */}
        {!abonnementActif ? (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-red-600 text-xl sm:text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-red-900 text-sm sm:text-base">Abonnement inactif</div>
                <div className="text-xs sm:text-sm text-red-700 mt-1">
                  Votre profil n&apos;est pas visible.{' '}
                  <Link href="/abonnements/plans" className="underline font-medium">
                    Souscrire un abonnement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <span className="text-base sm:text-lg">Mon abonnement actuel</span>
                <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full bg-green-600 text-white whitespace-nowrap">
                  {abonnementActif.statut}
                </span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Visible jusqu&apos;au{' '}
                {abonnementActif.dateFin
                  ? abonnementActif.dateFin.toLocaleDateString('fr-FR')
                  : '—'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Plan</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{abonnementActif.nom}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Période</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {abonnementActif.dateDebut
                    ? abonnementActif.dateDebut.toLocaleDateString('fr-FR')
                    : '—'}{' '}
                  →{' '}
                  {abonnementActif.dateFin
                    ? abonnementActif.dateFin.toLocaleDateString('fr-FR')
                    : '—'}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-xs uppercase text-gray-500 mb-1">Montant</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {abonnementActif.tarif ? `${abonnementActif.tarif.toLocaleString('fr-FR')} FCFA` : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Demandes reçues</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.demandesRecues}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">En cours</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.commandesEnCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Terminées</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.commandesTerminees}</div>
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Chiffre d&apos;affaire</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 break-words">
                {stats.chiffreAffaire.toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Réputation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Réputation</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Votre note moyenne et avis clients</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-4xl sm:text-5xl font-bold text-yellow-600">
                  {stats.noteMoyenne.toFixed(1)}
                </div>
                <div>
                  <div className="text-yellow-500 text-xl sm:text-2xl">★★★★★</div>
                  <div className="text-xs sm:text-sm text-gray-600">{stats.nombreAvis} avis</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Statut KYC</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Vérification de votre profil</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <span className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                prestataire?.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                prestataire?.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {prestataire?.kycStatut || 'NON_SOUMIS'}
              </span>
              {prestataire?.kycStatut !== 'VALIDE' && (
                <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                  <Link href="/prestataire/kyc" className="text-primary hover:underline">
                    Compléter la vérification
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/prestataire/profile/edit">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  ⚙️ Gérer mon profil
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Modifier vos informations et services
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/abonnements/plans">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  💳 Mon abonnement
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Gérer votre abonnement et paiements
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/commandes" className="sm:col-span-2 lg:col-span-1">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  📦 Mes commandes
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Consulter toutes vos commandes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Nouvelles demandes */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Nouvelles demandes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Demandes de service reçues</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {demandes.filter((d: any) => d.statut === 'EN_ATTENTE').length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
                Aucune nouvelle demande
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {demandes
                  .filter((d: any) => d.statut === 'EN_ATTENTE')
                  .slice(0, 5)
                  .map((demande: any) => (
                    <div key={demande.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base">{demande.service?.nom || 'Service'}</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{demande.description}</div>
                        <div className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                          Client: {demande.utilisateur?.phone} • {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors">
                          Accepter
                        </button>
                        <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors">
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

