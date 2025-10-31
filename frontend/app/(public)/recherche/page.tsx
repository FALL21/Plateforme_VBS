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
      setPrestataires(response.data.data || []);
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div role="heading" aria-level={1} className="text-3xl font-bold mb-6">Trouver le prestataire idéal près de chez vous</div>

        {/* Filtres */}
        <Card className="mb-6 bg-white/90">
          <CardHeader>
            <CardTitle>Filtres de recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des résultats */}
          <div className="lg:col-span-2 space-y-4">
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
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{prestataire.raisonSociale}</CardTitle>
                        <CardDescription>{prestataire.description}</CardDescription>
                        {prestataire.user?.address && (
                          <div className="text-sm text-gray-600 mt-1">{prestataire.user.address}</div>
                        )}
                      </div>
                      <img
                        src={prestataire.logoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'}
                        alt={prestataire.raisonSociale}
                        className="w-16 h-16 rounded-full object-cover border"
                        onError={(e) => ((e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'))}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                      <RatingStars rating={prestataire.noteMoyenne || 0} showValue size="sm" />
                      <span className="text-sm text-gray-600">
                        {prestataire.nombreAvis || 0} avis
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        prestataire.disponibilite
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ContactPrestataireButton prestataire={prestataire} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  {loading ? 'Recherche en cours...' : 'Aucun prestataire trouvé. Essayez de modifier vos critères.'}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Carte */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Carte</CardTitle>
                <CardDescription>Localisation des prestataires</CardDescription>
              </CardHeader>
              <CardContent>
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
                  <div className="h-[400px] flex items-center justify-center text-gray-500">
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
