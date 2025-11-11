'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RatingStars from '@/components/RatingStars';
import ContactPrestataireButton from '@/components/ContactPrestataireButton';

interface Prestataire {
  id: string;
  raisonSociale: string;
  description?: string;
  logoUrl?: string;
  noteMoyenne: number;
  nombreAvis?: number;
  _count?: {
    avis?: number;
  };
  user?: {
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
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [temoinages, setTemoinages] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
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
          // Position par défaut : Dakar
          setUserLocation([14.7167, -17.4677]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      // Position par défaut : Dakar
      setUserLocation([14.7167, -17.4677]);
    }
  }, []);

  // Charger les prestataires avec filtres (avec debounce pour searchQuery)
  useEffect(() => {
    if (!userLocation) return;

    const timer = setTimeout(() => {
      const fetchPrestataires = async () => {
        setLoading(true);
        try {
          const params: any = {
            lat: userLocation[0],
            lng: userLocation[1],
            limit: 12, // Afficher 12 prestataires
          };

          // Ajouter les filtres
          if (selectedSousSecteur) {
            params.sousSecteurId = selectedSousSecteur;
          } else if (selectedSecteur) {
            params.secteurId = selectedSecteur;
          }
          const rawSearch = searchQuery.trim();
          const normalizedSearch = rawSearch
            ? rawSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            : '';

          const response = await api.get('/prestataires', { params });
          let data = response.data.data || [];

          // Filtre accent-insensible côté client si une recherche est saisie
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
              // Inclure noms des services si dispo
              if (Array.isArray(p?.prestataireServices)) {
                for (const ps of p.prestataireServices) {
                  if (ps?.service?.nom) fields.push(norm(ps.service.nom));
                }
              }
              return fields.some((f) => f.includes(normalizedSearch));
            });
          }

          // Calcul distance (Haversine) et tri par proximité quand la position est connue
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
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

          // Charger les témoignages pour ces prestataires
          const avisPromises = limited.map(async (prestataire: Prestataire) => {
            try {
              const avisRes = await api.get(`/avis/prestataire/${prestataire.id}`);
              const avis = (avisRes.data || []).slice(0, 3); // Max 3 avis par prestataire
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
          const flattenedAvis = allAvis.flat().filter((avis) => avis.commentaire); // Seulement ceux avec commentaires
          // Mélanger et prendre les meilleurs (notes 4+)
          const bestAvis = flattenedAvis
            .filter((avis) => avis.note >= 4)
            .sort(() => Math.random() - 0.5)
            .slice(0, 6); // 6 témoignages

          setTemoinages(bestAvis);
        } catch (error) {
          console.error('Erreur chargement prestataires:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPrestataires();
    }, searchQuery ? 500 : 0); // Debounce seulement pour searchQuery

    return () => clearTimeout(timer);
  }, [userLocation, selectedSecteur, selectedSousSecteur, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec Filtres */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trouvez le prestataire idéal pour vos besoins
            </h1>
            <p className="text-xl text-gray-600">
              Des professionnels qualifiés près de vous
            </p>
          </div>
          
          {/* Filtres de recherche intégrés */}
          <Card className="bg-white/90 shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setSearchQuery(e.currentTarget.value)}
                  className="h-12"
                />
                
                <Select 
                  value={selectedSecteur} 
                  onValueChange={(v) => {
                    setSelectedSecteur(v === 'all' ? '' : v);
                    setSelectedSousSecteur(''); // Reset sous-secteur quand secteur change
                  }}
                >
                  <SelectTrigger className="h-12">
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
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sous-secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sous-secteurs</SelectItem>
                    {sousSecteurs.map((ss) => (
                      <SelectItem key={ss.id} value={ss.id}>
                        {ss.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Prestataires Proches */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Prestataires près de vous
          </h2>
          <p className="text-gray-600">
            Découvrez les meilleurs prestataires de services dans votre région
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : prestataires.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun prestataire trouvé dans votre région pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestataires.map((prestataire) => (
              <Card key={prestataire.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        <Link
                          href={`/prestataires/${prestataire.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {prestataire.raisonSociale}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <RatingStars rating={prestataire.noteMoyenne || 0} size="sm" />
                        <span className="text-sm text-gray-600">
                          {(prestataire.noteMoyenne || 0).toFixed(1)} (
                          {prestataire.nombreAvis || prestataire._count?.avis || 0} avis)
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                              <img
                               src={(() => {
                                 const normalizeUrl = (url: string | undefined) => {
                                   if (!url) return undefined;
                                   let n = url.replace(/\/+/g, '/');
                                   if (n.startsWith('/api/files/')) {
                                     return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${n}`;
                                   }
                                   if (n.startsWith('/files/')) {
                                     return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api${n}`;
                                   }
                                   return n;
                                 };
                                 const base = normalizeUrl(prestataire.logoUrl) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop';
                                 const version = (prestataire as any).updatedAt ? new Date((prestataire as any).updatedAt).getTime() : '';
                                 return version ? `${base}${base.includes('?') ? '&' : '?'}v=${version}` : base;
                               })()}
                        alt={prestataire.raisonSociale}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          // Fallback vers une image par défaut si l'image ne charge pas
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {prestataire.description && (
                    <CardDescription className="mb-4 line-clamp-2">
                      {prestataire.description}
                    </CardDescription>
                  )}
                  
                  {prestataire.prestataireServices && prestataire.prestataireServices.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Services proposés :</p>
                      <div className="flex flex-wrap gap-2">
                        {prestataire.prestataireServices.slice(0, 3).map((ps, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            {ps.service.nom}
                          </span>
                        ))}
                        {prestataire.prestataireServices.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{prestataire.prestataireServices.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {prestataire.user?.address && (
                    <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                      {prestataire.user.address}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/prestataires/${prestataire.id}`}
                      className="flex-1 text-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Voir plus
                    </Link>
                    <ContactPrestataireButton prestataire={prestataire} size="sm" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section Témoignages */}
      {temoinages.length > 0 && (
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Ce que disent nos clients
              </h2>
              <p className="text-gray-600">
                Découvrez les expériences réelles de nos utilisateurs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {temoinages.map((avis) => (
                <Card key={avis.id} className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars rating={avis.note} size="sm" />
                      <span className="text-sm font-medium text-gray-700">
                        {avis.prestataire.raisonSociale}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{avis.commentaire}"</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
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
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      Voir le prestataire →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-primary/10 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vous êtes prestataire de services ?
          </h2>
          <p className="text-gray-600 mb-6">
            Rejoignez notre plateforme et développez votre activité
          </p>
          <Link
            href="/prestataire/create"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Devenir prestataire
          </Link>
        </div>
      </div>
    </div>
  );
}
