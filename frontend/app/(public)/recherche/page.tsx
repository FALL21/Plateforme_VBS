'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RatingStars from '@/components/RatingStars';
import ContactPrestataireButton from '@/components/ContactPrestataireButton';
import dynamic from 'next/dynamic';
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function RecherchePage() {
  const router = useRouter();
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [sousSecteurs, setSousSecteurs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [servicesBySousSecteur, setServicesBySousSecteur] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  // Fonction pour normaliser les URLs de logo
  const getPublicApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return raw.replace(/\/?api\/?$/, '');
  };

  const normalizeLogoUrl = (url: string | undefined, updatedAt?: string | Date) => {
    if (!url) return undefined;
    let normalized = url.replace(/\/+/g, '/');
    const base = getPublicApiBase();
    if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
      const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      return `${normalized}${normalized.includes('?') ? '&' : '?'}v=${version}`;
    }
    if (normalized.startsWith('/api/files/')) {
      const full = `${base}${normalized}`;
      const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    if (normalized.startsWith('/files/')) {
      const full = `${base}/api${normalized}`;
      const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    if (normalized.startsWith('/')) {
      const full = `${base}${normalized}`;
      const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    const full = `${base}/api/files/${normalized}`;
    const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
  };

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState<string>('');
  const [selectedSousSecteur, setSelectedSousSecteur] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | undefined>(undefined);
  const [selectedPrestataire, setSelectedPrestataire] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

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
    // Afficher immédiatement une carte par défaut (Dakar), puis mettre à jour si géolocalisation dispo
    setUserLocation([14.7167, -17.4677]);
    setMapLoading(false);
    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 } as const;
      const geoTimeout = setTimeout(() => {}, 1500);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(geoTimeout);
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setUserAccuracy(position.coords.accuracy);
        },
        () => {
          clearTimeout(geoTimeout);
        },
        options
      );
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Mettre à jour si précision meilleure (< 50m)
          if (!userAccuracy || pos.coords.accuracy < userAccuracy) {
            setUserLocation([pos.coords.latitude, pos.coords.longitude]);
            setUserAccuracy(pos.coords.accuracy);
          }
        },
        undefined,
        options
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Charger les sous-secteurs quand un secteur est sélectionné
  useEffect(() => {
    if (selectedSecteur) {
      const fetchSousSecteurs = async () => {
        try {
          const response = await api.get(`/secteurs/${selectedSecteur}/sous-secteurs`);
          setSousSecteurs(response.data || []);
          const grouped: Record<string, any[]> = {};
          for (const ss of response.data || []) {
            const sv = await api.get('/services', { params: { sousSecteurId: ss.id } });
            grouped[ss.id] = sv.data || [];
          }
          setServicesBySousSecteur(grouped);
        } catch (error) {
          console.error('Erreur chargement sous-secteurs:', error);
        }
      };
      fetchSousSecteurs();
      setSelectedSousSecteur(''); // Reset
      setSelectedService(''); // Reset
    } else {
      setSousSecteurs([]);
      setServices([]);
    }
  }, [selectedSecteur]);

  // Charger les services quand un sous-secteur est sélectionné
  useEffect(() => {
    if (selectedSousSecteur) {
      const fetchServices = async () => {
        try {
          const response = await api.get('/services', {
            params: { sousSecteurId: selectedSousSecteur },
          });
          setServices(response.data || []);
        } catch (error) {
          console.error('Erreur chargement services:', error);
        }
      };
      fetchServices();
      setSelectedService(''); // Reset
    } else {
      setServices([]);
    }
  }, [selectedSousSecteur]);

  // Lancer automatiquement la recherche quand les filtres ou la position changent
  useEffect(() => {
    const t = setTimeout(() => {
      handleSearch();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSecteur, selectedSousSecteur, selectedService, userLocation]);

  // Recherche initiale au montage (sans clic)
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery || selectedService || selectedSecteur || selectedSousSecteur) {
        handleSearch();
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSousSecteur) params.sousSecteurId = selectedSousSecteur;
      else if (selectedSecteur) params.secteurId = selectedSecteur;
      if (selectedService) params.serviceId = selectedService; // conservé si présent
      if (searchQuery) params.search = searchQuery;
      if (userLocation) {
        params.lat = userLocation[0];
        params.lng = userLocation[1];
      }

      const response = await api.get('/prestataires', { params });
      let data = response.data.data || [];

      // Calcul de la distance et tri par distance (du plus proche au plus loin)
      if (userLocation && data.length > 0) {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; // Rayon de la Terre en km
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

        data = processed;
      }

      setPrestataires(data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const markers = prestataires
    .filter((p: any) => p.user?.latitude && p.user?.longitude)
    .map((p: any) => ({
      position: [p.user.latitude, p.user.longitude] as [number, number],
      title: p.raisonSociale,
      description: p.description,
      id: p.id,
    }));

  // Calcul d'itinéraire auto: vers le prestataire sélectionné ou le premier résultat
  useEffect(() => {
    const t = setTimeout(() => {
      if (prestataires.length > 0) {
        const selected = prestataires.find((p: any) => p.id === selectedPrestataire) || prestataires[0];
        if (selected) computeRoute(selected);
      } else {
        setRouteCoords([]);
      }
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestataires, selectedPrestataire, userLocation]);

  const computeRoute = async (p: any) => {
    if (!userLocation || !p?.user?.latitude || !p?.user?.longitude) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${p.user.longitude},${p.user.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      const coords = data?.routes?.[0]?.geometry?.coordinates || [];
      const latlngs: [number, number][] = coords.map((c: [number, number]) => [c[1], c[0]]);
      setRouteCoords(latlngs);
    } catch (e) {
      console.error('Erreur itinéraire:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div role="heading" aria-level={1} className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Trouver le prestataire idéal près de chez vous</div>

        {/* Filtres */}
        <Card className="bg-white/90">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-gray-900">Filtres de recherche</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Input
                placeholder="Rechercher par nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              <Select value={selectedSecteur} onValueChange={(v) => setSelectedSecteur(v === 'all' ? '' : v)}>
                <SelectTrigger>
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
                <SelectTrigger>
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

              {/* Filtre Service supprimé (le résultat suit secteur/sous-secteur) */}
            </div>
            
            {/* Recherche automatique activée — pas de bouton nécessaire */}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Liste des résultats */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 order-2 lg:order-1">
            {prestataires.length > 0 ? (
              prestataires.map((prestataire: any) => (
                <Card 
                  key={prestataire.id}
                  className={`cursor-pointer transition-shadow hover:shadow-lg bg-white ${
                    selectedPrestataire === prestataire.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedPrestataire(prestataire.id);
                    router.push(`/prestataires/${prestataire.id}`);
                  }}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg text-gray-900 break-words">{prestataire.raisonSociale}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-600 break-words line-clamp-2 sm:line-clamp-none">{prestataire.description}</CardDescription>
                        {prestataire.user?.address && (
                          <div className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{prestataire.user.address}</div>
                        )}
                      </div>
                      <div className="flex-shrink-0 self-start sm:self-auto">
                        <img
                          src={
                            normalizeLogoUrl(prestataire.logoUrl, prestataire.updatedAt) ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`
                          }
                          alt={prestataire.raisonSociale}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border flex-shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`;
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                      <RatingStars rating={prestataire.noteMoyenne || 0} showValue size="sm" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {prestataire.nombreAvis || 0} avis
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        prestataire.disponibilite
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
                      </span>
                      <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                        <ContactPrestataireButton prestataire={prestataire} size="sm" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 sm:py-8 text-center text-gray-500 p-4 sm:p-6">
                  <p className="text-xs sm:text-sm">
                    {loading ? 'Recherche en cours...' : 'Aucun prestataire trouvé. Essayez de modifier vos critères.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Carte */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-gray-900">Carte</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Localisation des prestataires</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {!mapLoading && userLocation && (
                  <MapView
                    center={userLocation}
                    zoom={selectedPrestataire ? 15 : 12}
                    markers={markers}
                    className="rounded-lg overflow-hidden"
                    route={routeCoords}
                    userPosition={userLocation || undefined}
                    userAccuracy={userAccuracy}
                  />
                )}
                {mapLoading && (
                  <div className="h-[300px] sm:h-[400px] flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                    Chargement de la carte...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
