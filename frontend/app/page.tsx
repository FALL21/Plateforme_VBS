'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import RatingStars from '@/components/RatingStars';
import ContactPrestataireButton from '@/components/ContactPrestataireButton';
import PrestataireOnboardingModal from '@/components/PrestataireOnboardingModal';

interface Prestataire {
  id: string;
  raisonSociale: string;
  description?: string;
  logoUrl?: string;
  noteMoyenne: number;
  nombreAvis?: number;
  disponibilite?: boolean;
  kycStatut?: string;
  abonnementActif?: boolean;
  updatedAt?: string;
  _count?: {
    avis?: number;
  };
  user?: {
    email?: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  prestataireServices?: Array<{
    tarifIndicatif?: number;
    service: {
      nom: string;
    };
  }>;
}

interface Avis {
  id: string;
  note: number;
  commentaire?: string;
  createdAt: string;
  utilisateur: {
    phone?: string;
  };
  prestataire: {
    id: string;
    raisonSociale: string;
  };
}

export default function HomePage() {
  const getPublicApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return raw.replace(/\/?api\/?$/, '');
  };

  const normalizeLogoUrl = (url: string | undefined, updatedAt?: string | Date) => {
    if (!url) return undefined;
    let normalized = url.replace(/\/+/g, '/');
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

  const appendCacheBuster = (url: string, updatedAt?: string | Date) => {
    if (!url) return url;
    const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
  };

  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [temoinages, setTemoinages] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('');
  const [selectedSousSecteur, setSelectedSousSecteur] = useState<string>('');
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [sousSecteurs, setSousSecteurs] = useState<any[]>([]);

  // Charger les secteurs au démarrage
  useEffect(() => {
    const fetchSecteurs = async () => {
      try {
        const response = await api.get('/secteurs');
        setSecteurs(response.data || []);
      } catch (error) {
        console.error('Erreur chargement secteurs:', error);
      }
    };
    fetchSecteurs();
  }, []);

  // Charger les sous-secteurs quand un secteur est sélectionné
  useEffect(() => {
    const fetchSousSecteurs = async () => {
      if (!selectedSecteur) {
        setSousSecteurs([]);
        return;
      }
      try {
        const response = await api.get(`/secteurs/${selectedSecteur}/sous-secteurs`);
        setSousSecteurs(response.data || []);
      } catch (error) {
        console.error('Erreur chargement sous-secteurs:', error);
      }
    };
    fetchSousSecteurs();
  }, [selectedSecteur]);

  // Géolocalisation utilisateur
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Géolocalisation refusée ou erreur:', error);
          setUserLocation([14.7167, -17.4677]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setUserLocation([14.7167, -17.4677]);
    }
  }, []);

  // Charger les prestataires avec filtres
  useEffect(() => {
    if (!userLocation) return;

    const timer = setTimeout(() => {
      const fetchPrestataires = async () => {
        setLoading(true);
        try {
          const params: any = {
            lat: userLocation[0],
            lng: userLocation[1],
            limit: 12,
          };

          if (selectedSousSecteur) {
            params.sousSecteurId = selectedSousSecteur;
          } else if (selectedSecteur) {
            params.secteurId = selectedSecteur;
          }
          const rawSearch = searchQuery.trim();
          if (rawSearch) {
            params.search = rawSearch;
          }

          const response = await api.get('/prestataires', { params });
          let data = response.data.data || [];

          const normalizedSearch = rawSearch
            ? rawSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            : '';

          if (normalizedSearch) {
            const norm = (s?: string) =>
              (s || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();
            data = data.filter((p: any) => {
              const fields = [
                norm(p?.raisonSociale),
                norm(p?.description),
                norm(p?.user?.address),
              ];
              if (Array.isArray(p?.prestataireServices)) {
                for (const ps of p.prestataireServices) {
                  if (ps?.service?.nom) fields.push(norm(ps.service.nom));
                }
              }
              return fields.some((f) => f.includes(normalizedSearch));
            });
          }

          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          const processed = data.map((p: any) => {
            const plat = p?.user?.latitude ?? (p?.localisation ? p.localisation.coordinates[1] : undefined);
            const plng = p?.user?.longitude ?? (p?.localisation ? p.localisation.coordinates[0] : undefined);
            let distanceKm = Number.POSITIVE_INFINITY;
            if (plat != null && plng != null && userLocation) {
              distanceKm = computeDistanceKm(userLocation[0], userLocation[1], plat, plng);
            }
            return { ...p, _distanceKm: distanceKm };
          })
          .sort((a: any, b: any) => (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity));

          const limited = processed.slice(0, 12);
          setPrestataires(limited);

          const avisPromises = limited.map(async (prestataire: Prestataire) => {
            try {
              const avisRes = await api.get(`/avis/prestataire/${prestataire.id}`);
              const avis = (avisRes.data || []).slice(0, 3);
              return avis.map((avis: any) => ({
                ...avis,
                prestataire: {
                  id: prestataire.id,
                  raisonSociale: prestataire.raisonSociale,
                },
              }));
            } catch (error) {
              return [];
            }
          });

          const allAvis = await Promise.all(avisPromises);
          const flattenedAvis = allAvis.flat().filter((avis) => avis.commentaire);
          const bestAvis = flattenedAvis
            .filter((avis) => avis.note >= 4)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);

          setTemoinages(bestAvis);
        } catch (error) {
          console.error('Erreur chargement prestataires:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPrestataires();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timer);
  }, [userLocation, selectedSecteur, selectedSousSecteur, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-white pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 leading-tight px-2">
              Trouvez le prestataire idéal
              <span className="block text-primary mt-1 sm:mt-2">pour vos besoins</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto px-4">
              Des professionnels qualifiés près de vous
            </p>
          </div>
          
          {/* Barre de recherche améliorée */}
          <Card className="bg-white shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    placeholder="Rechercher un prestataire, un service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 sm:pl-12 h-12 sm:h-14 text-sm sm:text-base border-2 focus:border-primary"
                  />
                </div>
                
                <div className="flex gap-3 md:w-auto">
                  <Select 
                    value={selectedSecteur} 
                    onValueChange={(v) => {
                      setSelectedSecteur(v === 'all' ? '' : v);
                      setSelectedSousSecteur('');
                    }}
                  >
                    <SelectTrigger className="h-12 sm:h-14 w-full md:w-[200px] border-2 focus:border-primary text-sm sm:text-base">
                      <SelectValue placeholder="Secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les secteurs</SelectItem>
                      {secteurs.map((secteur) => (
                        <SelectItem key={secteur.id} value={secteur.id}>
                          {secteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={selectedSousSecteur} 
                    onValueChange={(v) => setSelectedSousSecteur(v === 'all' ? '' : v)}
                    disabled={!selectedSecteur}
                  >
                    <SelectTrigger className="h-12 sm:h-14 w-full md:w-[200px] border-2 focus:border-primary text-sm sm:text-base" disabled={!selectedSecteur}>
                      <SelectValue placeholder="Sous-secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {sousSecteurs.map((ss) => (
                        <SelectItem key={ss.id} value={ss.id}>
                          {ss.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Prestataires */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Prestataires près de vous
              </h2>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                {prestataires.length > 0 
                  ? `${prestataires.length} prestataire${prestataires.length > 1 ? 's' : ''} disponible${prestataires.length > 1 ? 's' : ''}`
                  : 'Découvrez les meilleurs prestataires de services dans votre région'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-2">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : prestataires.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Aucun prestataire trouvé</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Essayez de modifier vos critères de recherche ou revenez plus tard.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSecteur('');
                  setSelectedSousSecteur('');
                }}
                variant="outline"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestataires.map((prestataire) => {
              const logoSrc =
                normalizeLogoUrl(prestataire.logoUrl as string | undefined, prestataire.updatedAt) ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'Prestataire')}&background=0D8ABC&color=fff&size=128`;
              return (
                <Card 
                  key={prestataire.id} 
                  className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={logoSrc}
                          alt={prestataire.raisonSociale}
                          className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 group-hover:border-primary/50 transition-colors shadow-md"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`;
                          }}
                        />
                        {prestataire.disponibilite && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                          <Link
                            href={`/prestataires/${prestataire.id}`}
                            className="hover:underline line-clamp-2"
                          >
                            {prestataire.raisonSociale}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <RatingStars rating={prestataire.noteMoyenne || 0} size="sm" />
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {(prestataire.noteMoyenne || 0).toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({prestataire.nombreAvis || prestataire._count?.avis || 0} avis)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {prestataire.disponibilite ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Indisponible
                        </span>
                      )}
                    </div>

                    {prestataire.description && (
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 leading-relaxed">
                        {prestataire.description}
                      </p>
                    )}
                    
                    {prestataire.prestataireServices && prestataire.prestataireServices.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {prestataire.prestataireServices.slice(0, 3).map((ps, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                            >
                              {ps.service.nom}
                            </span>
                          ))}
                          {prestataire.prestataireServices.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                              +{prestataire.prestataireServices.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {prestataire.user?.address && (
                      <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 pt-2 border-t">
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-1">{prestataire.user.address}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/prestataires/${prestataire.id}`}
                        className="flex-1 flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-medium text-primary hover:text-primary/80 hover:underline py-1.5 sm:py-2 rounded-md hover:bg-primary/5 transition-colors"
                      >
                        <span>Voir plus</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <div className="flex-1">
                        <ContactPrestataireButton prestataire={prestataire} size="sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Témoignages */}
      {temoinages.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-white py-8 sm:py-12 lg:py-16 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                Ce que disent nos clients
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                Découvrez les expériences réelles de nos utilisateurs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {temoinages.map((avis) => (
                <Card key={avis.id} className="bg-white border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <RatingStars rating={avis.note} size="sm" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {avis.prestataire.raisonSociale}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 italic leading-relaxed">
                      "{avis.commentaire}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 sm:pt-3 border-t">
                      <span className="font-medium">
                        {avis.utilisateur.phone
                          ? `${avis.utilisateur.phone.substring(0, 3)}***${avis.utilisateur.phone.substring(avis.utilisateur.phone.length - 2)}`
                          : 'Client anonyme'}
                      </span>
                      <span>
                        {new Date(avis.createdAt).toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <Link
                      href={`/prestataires/${avis.prestataire.id}`}
                      className="text-xs text-primary hover:underline font-medium mt-3 inline-flex items-center gap-1"
                    >
                      Voir le prestataire
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-8 sm:py-12 lg:py-16 mt-8 sm:mt-12 lg:mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 shadow-lg">
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
                Vous êtes prestataire de services ?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto">
                Rejoignez notre plateforme et développez votre activité avec des milliers de clients potentiels
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => setOnboardingModalOpen(true)}
            >
              Devenir prestataire
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <PrestataireOnboardingModal
              open={onboardingModalOpen}
              onOpenChange={setOnboardingModalOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
