'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import { toastSuccess, toastError } from '@/lib/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import BackButton from '@/components/BackButton';

const getPublicApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return raw.replace(/\/?api\/?$/, '');
};

const appendCacheBuster = (url: string, updatedAt?: string | Date) => {
  if (!url) return url;
  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
};

const normalizeLogoUrl = (url?: string, updatedAt?: string | Date) => {
  if (!url) return undefined;
  let normalized = url.trim();
  if (!normalized) return undefined;

  const base = getPublicApiBase();

  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
    return appendCacheBuster(normalized, updatedAt);
  }

  if (normalized.startsWith('/api/files/')) {
    return appendCacheBuster(`${base}${normalized}`, updatedAt);
  }

  if (normalized.startsWith('/files/')) {
    return appendCacheBuster(`${base}/api${normalized}`, updatedAt);
  }

  if (normalized.startsWith('/')) {
    return appendCacheBuster(`${base}${normalized}`, updatedAt);
  }

  return appendCacheBuster(`${base}/api/files/${normalized}`, updatedAt);
};

const getUserDisplayName = (user: any) => {
  if (user?.prestataire?.raisonSociale) return user.prestataire.raisonSociale;
  if (user?.email) return user.email;
  if (user?.phone) return user.phone;
  return 'Utilisateur';
};

const getUserAvatar = (user: any) => {
  const displayName = getUserDisplayName(user);

  if (user?.prestataire?.logoUrl) {
    const normalized = normalizeLogoUrl(user.prestataire.logoUrl, user.prestataire.updatedAt);
    if (normalized) return normalized;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;
};

export default function UsersManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggleStatus' | 'toggleAbonnement' | 'changeRole' | null;
    userId?: string;
    prestataireId?: string;
    currentStatus?: boolean;
    currentRole?: string;
    userInfo?: string;
  }>({
    open: false,
    type: null,
  });
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId?: string;
    currentRole?: string;
    newRole?: string;
  }>({
    open: false,
  });

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, user, router, roleFilter, countryFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users', {
        params: {
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          country: countryFilter !== 'ALL' ? countryFilter : undefined,
          search: searchQuery || undefined,
        },
      });
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRESTATAIRE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'PRESTATAIRE': return 'Prestataire';
      case 'USER': return 'Client';
      default: return role;
    }
  };

  const handleChangeRoleClick = (userId: string, currentRole: string) => {
    setRoleChangeDialog({
      open: true,
      userId,
      currentRole,
      newRole: undefined,
    });
  };

  const confirmChangeRole = async () => {
    if (!roleChangeDialog.userId || !roleChangeDialog.newRole) return;

    const roleLabels: Record<string, string> = { USER: 'Client', PRESTATAIRE: 'Prestataire', ADMIN: 'Admin' };

    try {
      await api.patch(`/users/${roleChangeDialog.userId}/role`, { role: roleChangeDialog.newRole });
      toastSuccess('Rôle modifié', `Le rôle a été changé en ${roleLabels[roleChangeDialog.newRole]} avec succès.`);
      setRoleChangeDialog({ open: false });
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement rôle:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible de modifier le rôle. Veuillez réessayer.');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDialog.userId) return;

    try {
      await api.delete(`/users/${confirmDialog.userId}`);
      toastSuccess('Utilisateur supprimé', 'L\'utilisateur a été supprimé avec succès.');
      setConfirmDialog({ open: false, type: null });
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      toastError('Erreur', error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleToggleStatus = async () => {
    if (!confirmDialog.userId || confirmDialog.currentStatus === undefined) return;

    try {
      await api.patch(`/users/${confirmDialog.userId}/toggle-status`);
      toastSuccess(
        'Statut modifié',
        `Compte ${confirmDialog.currentStatus ? 'désactivé' : 'activé'} avec succès !`
      );
      setConfirmDialog({ open: false, type: null });
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement statut:', error);
      toastError('Erreur', error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleToggleAbonnement = async () => {
    if (!confirmDialog.prestataireId || confirmDialog.currentStatus === undefined) return;

    try {
      await api.patch(`/prestataires/${confirmDialog.prestataireId}/toggle-abonnement`);
      toastSuccess(
        'Abonnement modifié',
        `Abonnement ${confirmDialog.currentStatus ? 'désactivé' : 'activé'} avec succès !`
      );
      setConfirmDialog({ open: false, type: null });
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement abonnement:', error);
      toastError('Erreur', error.response?.data?.message || 'Erreur lors du changement d\'abonnement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  const stats = {
    total: filteredUsers.length,
    admins: filteredUsers.filter(u => u.role === 'ADMIN').length,
    prestataires: filteredUsers.filter(u => u.role === 'PRESTATAIRE').length,
    clients: filteredUsers.filter(u => u.role === 'USER').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Consultation et modération des comptes
            </p>
          </div>
          <BackButton href="/admin/dashboard" label="Retour au dashboard" />
        </div>

        {/* Statistiques */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
              Statistiques
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-primary/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Total</p>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">
                  {stats.total}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-green-500/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-2.5 bg-green-500/10 rounded-xl shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Clients</p>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">
                  {stats.clients}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-blue-500/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-2.5 bg-blue-500/10 rounded-xl shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Prestataires</p>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {stats.prestataires}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-2 border-purple-500/20 bg-white">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-2.5 bg-purple-500/10 rounded-xl shadow-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-700">Admins</p>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">
                  {stats.admins}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtres */}
        <Card className="shadow-sm border-2 bg-white">
          <CardHeader className="p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Filtres</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <Input
                placeholder="Rechercher par email, téléphone, adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 sm:h-11 border-2 border-gray-200 focus:border-primary/30 transition-colors"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10 sm:h-11 border-2 border-gray-200 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les rôles</SelectItem>
                  <SelectItem value="USER">Clients uniquement</SelectItem>
                  <SelectItem value="PRESTATAIRE">Prestataires uniquement</SelectItem>
                  <SelectItem value="ADMIN">Admins uniquement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="h-10 sm:h-11 border-2 border-gray-200 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="Filtrer par pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les pays</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 font-medium">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <Card className="shadow-sm border-2 bg-white">
          <CardHeader className="p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Liste des utilisateurs</CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm text-gray-600">Tous les comptes enregistrés sur la plateforme</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6 pt-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 text-base sm:text-lg">Aucun utilisateur trouvé avec ces critères</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredUsers.map((u: any) => (
                  <div 
                    key={u.id} 
                    className="p-4 sm:p-5 lg:p-6 border-2 rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-200 bg-white"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-5 lg:gap-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {(() => {
                          const displayName = getUserDisplayName(u);
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;
                          const avatarUrl = getUserAvatar(u) || fallback;
                          return (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                              data-fallback-applied="false"
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (target.dataset.fallbackApplied === 'true') return;
                                target.dataset.fallbackApplied = 'true';
                                target.src = fallback;
                              }}
                            />
                          );
                        })()}
                      </div>

                      {/* Informations utilisateur */}
                      <div className="flex-1 min-w-0 w-full lg:w-auto">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold border ${getRoleColor(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold border ${
                            u.actif ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {u.actif ? '✓ Actif' : '✗ Désactivé'}
                          </span>
                          {u.role === 'PRESTATAIRE' && u.prestataire?.kycStatut && (
                            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold border ${
                              u.prestataire.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800 border-green-200' :
                              u.prestataire.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              KYC: {u.prestataire.kycStatut}
                            </span>
                          )}
                        </div>

                        {/* Informations principales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm mb-3 sm:mb-4">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Email</p>
                            <p className="font-semibold text-gray-900 break-words">{u.email || 'Non renseigné'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Téléphone</p>
                            <p className="font-semibold text-gray-900 break-words">{u.phone || 'Non renseigné'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Inscription</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {/* Adresse */}
                        {u.address && (
                          <div className="mb-3 sm:mb-4 text-sm space-y-1">
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">Adresse</p>
                            <p className="font-semibold text-gray-900 break-words">{u.address}</p>
                          </div>
                        )}

                        {/* Informations prestataire */}
                        {u.role === 'PRESTATAIRE' && u.prestataire && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{u.prestataire.raisonSociale}</p>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                u.prestataire.abonnementActif 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                {u.prestataire.abonnementActif ? '✓ Abonnement actif' : '✗ Abonnement inactif'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Avis: {u.prestataire.nombreAvis || 0} • 
                              Note: {(u.prestataire.noteMoyenne || 0).toFixed(1)}/5 •
                              Disponibilité: {u.prestataire.disponibilite ? 'Oui' : 'Non'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(u.id)}
                          className="w-full sm:w-auto lg:w-full h-9 sm:h-10 text-xs sm:text-sm border-2 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Détails
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeRoleClick(u.id, u.role)}
                          className="w-full sm:w-auto lg:w-full h-9 sm:h-10 text-xs sm:text-sm border-2 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Changer rôle
                        </Button>
                        {u.role === 'PRESTATAIRE' && u.prestataire && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`w-full sm:w-auto lg:w-full h-9 sm:h-10 text-xs sm:text-sm border-2 transition-colors ${
                              u.prestataire.abonnementActif 
                                ? 'text-orange-600 border-orange-300 hover:bg-orange-50' 
                                : 'text-green-600 border-green-300 hover:bg-green-50'
                            }`}
                            onClick={() => setConfirmDialog({
                              open: true,
                              type: 'toggleAbonnement',
                              prestataireId: u.prestataire.id,
                              currentStatus: u.prestataire.abonnementActif,
                              userInfo: u.prestataire.raisonSociale || u.email || u.phone || 'Prestataire',
                            })}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            {u.prestataire.abonnementActif ? 'Désactiver abonnement' : 'Activer abonnement'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full sm:w-auto lg:w-full h-9 sm:h-10 text-xs sm:text-sm border-2 transition-colors ${
                            u.actif 
                              ? 'text-orange-600 border-orange-300 hover:bg-orange-50' 
                              : 'text-green-600 border-green-300 hover:bg-green-50'
                          }`}
                          onClick={() => setConfirmDialog({
                            open: true,
                            type: 'toggleStatus',
                            userId: u.id,
                            currentStatus: u.actif,
                            userInfo: u.email || u.phone || 'Utilisateur',
                          })}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {u.actif ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {u.actif ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto lg:w-full h-9 sm:h-10 text-xs sm:text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setConfirmDialog({
                            open: true,
                            type: 'delete',
                            userId: u.id,
                            userInfo: u.email || u.phone || 'Utilisateur',
                          })}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation suppression */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'delete'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null })}
        title="Supprimer l'utilisateur"
        description={
          <>
            <p className="text-base text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer l'utilisateur : <strong className="text-gray-900">{confirmDialog.userInfo}</strong> ?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-red-800 font-medium">
                Cette action est irréversible !
              </p>
            </div>
          </>
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDeleteUser}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />

      {/* Dialog de confirmation changement statut */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'toggleStatus'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null })}
        title={confirmDialog.currentStatus ? "Désactiver le compte" : "Activer le compte"}
        description={
          <p className="text-base text-gray-700">
            Êtes-vous sûr de vouloir {confirmDialog.currentStatus ? 'désactiver' : 'activer'} le compte : <strong className="text-gray-900">{confirmDialog.userInfo}</strong> ?
          </p>
        }
        confirmText={confirmDialog.currentStatus ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        variant={confirmDialog.currentStatus ? "destructive" : "default"}
        onConfirm={handleToggleStatus}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {confirmDialog.currentStatus ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        }
      />

      {/* Dialog de confirmation changement abonnement */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'toggleAbonnement'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null })}
        title={confirmDialog.currentStatus ? "Désactiver l'abonnement" : "Activer l'abonnement"}
        description={
          <>
            <p className="text-base text-gray-700 mb-2">
              Êtes-vous sûr de vouloir {confirmDialog.currentStatus ? 'désactiver' : 'activer'} l'abonnement du prestataire : <strong className="text-gray-900">{confirmDialog.userInfo}</strong> ?
            </p>
            {confirmDialog.currentStatus ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-orange-800">
                  Le prestataire ne sera plus visible sur la plateforme.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-green-800">
                  Le prestataire deviendra visible et disponible sur la plateforme.
                </p>
              </div>
            )}
          </>
        }
        confirmText={confirmDialog.currentStatus ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        variant={confirmDialog.currentStatus ? "destructive" : "default"}
        onConfirm={handleToggleAbonnement}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      />

      {/* Dialog de changement de rôle */}
      <ConfirmDialog
        open={roleChangeDialog.open}
        onOpenChange={(open) => !open && setRoleChangeDialog({ open: false })}
        title="Changer le rôle"
        description={
          <div className="space-y-3">
            <p className="text-base text-gray-700">
              Sélectionnez le nouveau rôle pour cet utilisateur :
            </p>
            <div className="grid grid-cols-1 gap-2">
              {['USER', 'PRESTATAIRE', 'ADMIN'].map((role) => {
                if (role === roleChangeDialog.currentRole) return null;
                const roleLabels: Record<string, string> = { USER: 'Client', PRESTATAIRE: 'Prestataire', ADMIN: 'Admin' };
                return (
                  <Button
                    key={role}
                    variant={roleChangeDialog.newRole === role ? 'default' : 'outline'}
                    onClick={() => setRoleChangeDialog({ ...roleChangeDialog, newRole: role })}
                    className="justify-start"
                  >
                    {roleChangeDialog.newRole === role && '✓ '}
                    {roleLabels[role]}
                  </Button>
                );
              })}
            </div>
          </div>
        }
        confirmText="Confirmer"
        cancelText="Annuler"
        variant="default"
        onConfirm={confirmChangeRole}
        onCancel={() => setRoleChangeDialog({ ...roleChangeDialog, newRole: undefined })}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
      />
    </div>
  );
}
