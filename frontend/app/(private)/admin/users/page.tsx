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

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const roles = ['USER', 'PRESTATAIRE', 'ADMIN'];
    const roleLabels: Record<string, string> = { USER: 'Client', PRESTATAIRE: 'Prestataire', ADMIN: 'Admin' };
    
    const options = roles.map(r => `${r === currentRole ? '✓ ' : ''}${roleLabels[r]}`).join('\n');
    const choice = prompt(`Choisir le nouveau rôle:\n${options}\n\nEntrez: USER, PRESTATAIRE ou ADMIN`);
    
    if (!choice) return;
    
    const newRole = choice.toUpperCase();
    if (!roles.includes(newRole) || newRole === currentRole) return;

    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toastSuccess('Rôle modifié', `Le rôle a été changé en ${roleLabels[newRole]} avec succès.`);
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement rôle:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible de modifier le rôle. Veuillez réessayer.');
    }
  };

  const handleDeleteUser = async (userId: string, userInfo: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur:\n${userInfo}\n\nCette action est irréversible !`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      alert('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean, userInfo: string) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} le compte:\n${userInfo}`)) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/toggle-status`);
      alert(`Compte ${currentStatus ? 'désactivé' : 'activé'} avec succès !`);
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement statut:', error);
      alert(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleToggleAbonnement = async (prestataireId: string, currentStatus: boolean, userInfo: string) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (!confirm(`Êtes-vous sûr de vouloir ${action} l'abonnement du prestataire:\n${userInfo}\n\n${currentStatus ? 'Le prestataire ne sera plus visible sur la plateforme.' : 'Le prestataire deviendra visible et disponible sur la plateforme.'}`)) {
      return;
    }

    try {
      await api.patch(`/prestataires/${prestataireId}/toggle-abonnement`);
      alert(`Abonnement ${currentStatus ? 'désactivé' : 'activé'} avec succès !`);
      fetchUsers();
    } catch (error: any) {
      console.error('Erreur changement abonnement:', error);
      alert(error.response?.data?.message || 'Erreur lors du changement d\'abonnement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-2">Consultation et modération des comptes</p>
          </div>
          <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
            ← Retour au dashboard
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.clients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Prestataires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.prestataires}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Rechercher par email, téléphone, adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
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
                <SelectTrigger>
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
            <div className="mt-4 text-sm text-gray-600">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>Tous les comptes enregistrés sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun utilisateur trouvé avec ces critères
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((u: any) => (
                  <div key={u.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {(() => {
                          const displayName = getUserDisplayName(u);
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=128`;
                          const avatarUrl = getUserAvatar(u) || fallback;
                          return (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-16 h-16 rounded-full object-cover border"
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
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.actif ? '✓ Actif' : '✗ Désactivé'}
                          </span>
                          {u.role === 'PRESTATAIRE' && u.prestataire?.kycStatut && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.prestataire.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-800' :
                              u.prestataire.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              KYC: {u.prestataire.kycStatut}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium">{u.email || 'Non renseigné'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Téléphone</p>
                            <p className="font-medium">{u.phone || 'Non renseigné'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Inscription</p>
                            <p className="font-medium">
                              {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {u.address && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">Adresse</p>
                            <p>{u.address}</p>
                          </div>
                        )}

                        {u.role === 'PRESTATAIRE' && u.prestataire && (
                          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{u.prestataire.raisonSociale}</p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                u.prestataire.abonnementActif 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.prestataire.abonnementActif ? '✓ Abonnement actif' : '✗ Abonnement inactif'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs mt-1">
                              Avis: {u.prestataire.nombreAvis || 0} • 
                              Note: {(u.prestataire.noteMoyenne || 0).toFixed(1)}/5 •
                              Disponibilité: {u.prestataire.disponibilite ? 'Oui' : 'Non'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(u.id)}
                        >
                          👁️ Détails
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeRole(u.id, u.role)}
                        >
                          🔄 Changer rôle
                        </Button>
                        {u.role === 'PRESTATAIRE' && u.prestataire && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={u.prestataire.abonnementActif ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'text-green-600 border-green-300 hover:bg-green-50'}
                            onClick={() => handleToggleAbonnement(u.prestataire.id, u.prestataire.abonnementActif, u.prestataire.raisonSociale || u.email || u.phone || 'Prestataire')}
                          >
                            {u.prestataire.abonnementActif ? '💳 Désactiver abonnement' : '💳 Activer abonnement'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className={u.actif ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'text-green-600 border-green-300 hover:bg-green-50'}
                          onClick={() => handleToggleStatus(u.id, u.actif, u.email || u.phone || 'Utilisateur')}
                        >
                          {u.actif ? '🔒 Désactiver' : '✅ Activer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteUser(u.id, u.email || u.phone || 'Utilisateur')}
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
      </div>
    </div>
  );
}

