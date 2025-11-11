'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import Link from 'next/link';

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
    return <div className="min-h-screen p-8">Chargement...</div>;
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

        {profile?.role !== 'PRESTATAIRE' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <img
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.phone || 'Utilisateur')}&background=0D8ABC&color=fff&size=128`
                  }
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff&size=128';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">
                    {profile?.role || user?.role}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{displayedEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{displayedPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="font-medium">{displayedAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Profil Prestataire */}
        {profile?.role === 'PRESTATAIRE' && prestataire && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-start gap-6">
              <img
                src={(() => {
                  const base = normalizeLogoUrl(prestataire.logoUrl as string | undefined) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`;
                  return `${base}${base.includes('?') ? '&' : '?'}v=${new Date(prestataire.updatedAt || Date.now()).getTime()}`;
                })()}
                alt={prestataire.raisonSociale}
                className="w-24 h-24 rounded-full object-cover border"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=P&background=0D8ABC&color=fff&size=128';
                }}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold">{prestataire.raisonSociale}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded ${prestataire.disponibilite ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${prestataire.kycStatut === 'VALIDE' ? 'bg-green-100 text-green-700' : prestataire.kycStatut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    KYC: {prestataire.kycStatut}
                  </span>
                </div>
                {prestataire.description && (
                  <p className="text-gray-700 mb-2">{prestataire.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-600">
                    <span className="font-medium">Email: </span>
                    {displayedEmail}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Téléphone: </span>
                    {displayedPhone}
                  </div>
                  <div className="md:col-span-2 text-gray-600">
                    <span className="font-medium">Adresse: </span>
                    {displayedAddress}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Services: </span>
                    {activeServices.length}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Note moyenne: </span>
                    {(prestataire.noteMoyenne || 0).toFixed(1)} ({prestataire.nombreAvis || 0} avis)
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Services proposés</p>
                  {activeServices.length > 0 ? (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {activeServices.map((service: any) => (
                        <li key={service.id} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                          <span>{service.service?.nom || 'Service'}</span>
                          {typeof service.tarifIndicatif === 'number' && (
                            <span className="text-gray-500 text-xs">À partir de {service.tarifIndicatif.toLocaleString('fr-FR')} FCFA</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun service configuré pour le moment.</p>
                  )}
                </div>
                <div className="mt-3">
                  <Link href="/prestataire/profile/edit" className="text-sm text-primary hover:underline">Modifier le profil prestataire</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

