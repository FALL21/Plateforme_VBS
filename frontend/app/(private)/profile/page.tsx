'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prestataire, setPrestataire] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setProfile(response.data);
        if (response.data?.role === 'PRESTATAIRE') {
          try {
            const p = await api.get('/prestataires/mon-profil');
            setPrestataire(p.data);
          } catch {}
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const up = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = up.data?.url as string;
      if (user?.role === 'PRESTATAIRE' && url) {
        await api.patch('/prestataires/me', { logoUrl: url });
        setPrestataire((prev: any) => ({
          ...prev,
          logoUrl: url,
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors du téléversement de la photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const normalizeLogoUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }

    const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const baseApi = rawBase.replace(/\/?api\/?$/, '');

    if (url.startsWith('/api/files/')) {
      return `${baseApi}${url}`;
    }

    if (url.startsWith('/files/')) {
      return `${baseApi}/api${url}`;
    }

    if (url.startsWith('/')) {
      return `${baseApi}${url}`;
    }

    return `${baseApi}/api/files/${url}`;
  };

  const rawAvatar = (user?.role === 'PRESTATAIRE' && prestataire?.logoUrl) || undefined;
  const avatarBase = normalizeLogoUrl(rawAvatar);
  const avatarUrl = avatarBase
    ? `${avatarBase}${avatarBase.includes('?') ? '&' : '?'}v=${prestataire?.updatedAt ? new Date(prestataire.updatedAt as any).getTime() : Date.now()}`
    : undefined;

  const fallbackEmail = prestataire?.user?.email || undefined;
  const fallbackPhone = prestataire?.user?.phone || undefined;
  const fallbackAddress = prestataire?.user?.address || undefined;

  const displayedEmail = profile?.email || fallbackEmail || 'Non renseigné';
  const displayedPhone = profile?.phone || fallbackPhone || 'Non renseigné';
  const displayedAddress = profile?.address || fallbackAddress || 'Non renseignée';

  const activeServices = Array.isArray(prestataire?.prestataireServices)
    ? prestataire.prestataireServices.filter((service: any) => service?.actif !== false)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Mon Profil</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </Button>
        </div>

        {/* Profil Client */}
        {profile?.role !== 'PRESTATAIRE' && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="relative">
                    <img
                      src={
                        avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.phone || 'Utilisateur')}&background=0D8ABC&color=fff&size=200`
                      }
                      alt="Avatar"
                      className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff&size=200';
                      }}
                    />
                    <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full shadow-md">
                      {profile?.role || user?.role || 'CLIENT'}
                    </span>
                  </div>
                </div>

                {/* Informations */}
                <div className="flex-1 w-full">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Email</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{displayedEmail}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Téléphone</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{displayedPhone}</p>
                      </div>

                      <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Adresse</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">{displayedAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Profil Prestataire */}
        {profile?.role === 'PRESTATAIRE' && prestataire && (
          <>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="relative">
                      <img
                        src={(() => {
                          const base = normalizeLogoUrl(prestataire.logoUrl as string | undefined) ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=200`;
                          return `${base}${base.includes('?') ? '&' : '?'}v=${new Date(prestataire.updatedAt || Date.now()).getTime()}`;
                        })()}
                        alt={prestataire.raisonSociale}
                        className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=P&background=0D8ABC&color=fff&size=200';
                        }}
                      />
                      <div className="absolute -bottom-2 -right-2 flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full shadow-md ${
                          prestataire.disponibilite 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-400 text-white'
                        }`}>
                          {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full shadow-md ${
                          prestataire.kycStatut === 'VALIDE' 
                            ? 'bg-green-500 text-white'
                            : prestataire.kycStatut === 'EN_ATTENTE' 
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          KYC: {prestataire.kycStatut}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="flex-1 w-full space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{prestataire.raisonSociale}</h2>
                      {prestataire.description && (
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{prestataire.description}</p>
                      )}
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-medium text-blue-600 uppercase">Services</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-900">{activeServices.length}</p>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <p className="text-xs font-medium text-yellow-600 uppercase">Note</p>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-900">
                          {(prestataire.noteMoyenne || 0).toFixed(1)}
                          <span className="text-sm sm:text-base text-yellow-700 ml-1">
                            ({prestataire.nombreAvis || 0})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Informations de contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 break-words">{displayedEmail}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-500 uppercase">Téléphone</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{displayedPhone}</p>
                      </div>

                      <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-500 uppercase">Adresse</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{displayedAddress}</p>
                      </div>
                    </div>

                    {/* Services proposés */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Services proposés
                      </h3>
                      {activeServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeServices.map((service: any) => (
                            <div
                              key={service.id}
                              className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                                    {service.service?.nom || 'Service'}
                                  </p>
                                  {typeof service.tarifIndicatif === 'number' && (
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      À partir de <span className="font-bold text-primary">{service.tarifIndicatif.toLocaleString('fr-FR')} FCFA</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200 text-center">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm text-gray-600">Aucun service configuré pour le moment.</p>
                        </div>
                      )}
                    </div>

                    {/* Bouton modifier */}
                    <div className="pt-2">
                      <Link href="/prestataire/profile/edit">
                        <Button className="w-full sm:w-auto" size="lg">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier le profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
