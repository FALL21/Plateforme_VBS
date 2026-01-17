'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RatingStars from '@/components/RatingStars';
import ContactPrestataireButton from '@/components/ContactPrestataireButton';
import BackButton from '@/components/BackButton';

export default function PrestataireDetailPage() {
  const params = useParams();
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

  const normalizeImageUrl = (url?: string, updatedAt?: string | Date) => {
    if (!url) return undefined;
    let normalized = url.trim().replace(/\/+/g, '/');
    if (!normalized) return undefined;
    
    const base = getPublicApiBase();
    const version = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    
    if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
      return `${normalized}${normalized.includes('?') ? '&' : '?'}v=${version}`;
    }
    
    if (normalized.startsWith('/api/files/')) {
      const full = `${base}${normalized}`;
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    
    if (normalized.startsWith('/files/')) {
      const full = `${base}/api${normalized}`;
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    
    if (normalized.startsWith('/')) {
      const full = `${base}${normalized}`;
      return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
    }
    
    const full = `${base}/api/files/${normalized}`;
    return `${full}${full.includes('?') ? '&' : '?'}v=${version}`;
  };

  const [prestataire, setPrestataire] = useState<any>(null);
  const [prestationsRecent, setPrestationsRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState<any | null>(null);
  const [selectedTravail, setSelectedTravail] = useState<any | null>(null);

  const getWhatsAppLink = (rawPhone?: string, message?: string) => {
    if (!rawPhone) return '';
    let digits = (rawPhone || '').replace(/\D/g, '');
    // Remove leading 00
    if (digits.startsWith('00')) digits = digits.slice(2);
    // If local starting with 0, default to Senegal country code 221
    if (digits.startsWith('0') && !digits.startsWith('221')) {
      digits = `221${digits.slice(1)}`;
    }
    if (!digits.startsWith('221') && rawPhone.startsWith('+')) {
      digits = digits; // keep parsed international format
    }
    const text = message || `Bonjour, je vous contacte via VBS pour votre service.`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  // Sélecteur d'image démo déterministe par prestation
  const getDemoImageUrl = (prestation: any, size: 'thumb' | 'full', indexFallback: number) => {
    const ids = [
      '1560472354-b33ff0c44a43', '1556742502-ec7c0e9f34b1', '1556075798-4825dfaaf498', '1517245386807-bb43f82c33c4',
      '1503387762-592deb58ef4e', '1508898578281-774ac4893a54', '1481277542470-605612bd2d61', '1485827404703-89b55fcc595e',
      '1492684223066-81342ee5ff30', '1497366216548-37526070297c', '1497366811353-6870744d04b2', '1500530855697-b586d89ba3ee',
      '1500534314209-a25ddb2bd429', '1504805572947-34fad45aed93', '1489365091240-6ebdab30f434', '1497366216547-4abb29e9e95b'
    ];

    // djb2 hash pour bonne distribution, en incluant plus d'inputs pour réduire les collisions
    const hashString = (
      `${prestation?.id || ''}|${prestation?.demandeId || ''}|${prestation?.demande?.id || ''}|${prestation?.createdAt || ''}|${prestation?.updatedAt || ''}|${prestation?.demande?.service?.nom || ''}`
    ).toString();
    let hash = 5381;
    for (let i = 0; i < hashString.length; i++) {
      hash = (hash * 33) ^ hashString.charCodeAt(i);
    }
    const safe = (hash >>> 0) + indexFallback * 7; // décaler plus pour limiter collisions voisines
    const pick = ids[safe % ids.length];
    const width = size === 'full' ? 800 : 220;
    // Ajouter un paramètre sig pour casser le cache si mêmes IDs aboutissent par hasard
    return `https://images.unsplash.com/photo-${pick}?w=${width}&auto=format&fit=crop&sig=${safe % 97}`;
  };

  // Géolocalisation utilisateur
  useEffect(() => {
    console.log('🔍 Vérification géolocalisation...');
    
    if (!('geolocation' in navigator)) {
      console.warn('❌ Géolocalisation non supportée par le navigateur');
      return;
    }

    console.log('✅ Géolocalisation disponible, demande de position...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('✅ Position GPS récupérée:', { lat, lng, accuracy: position.coords.accuracy });
        setUserLocation([lat, lng]);
      },
      (error) => {
        console.error('❌ Erreur géolocalisation:', {
          code: error.code,
          message: error.message,
          codeName: error.code === 1 ? 'PERMISSION_DENIED' : error.code === 2 ? 'POSITION_UNAVAILABLE' : 'TIMEOUT'
        });
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        console.log('📡 Récupération des données du prestataire...', { id: params.id });
        const [prestataireRes, prestationsRes] = await Promise.all([
          api.get(`/prestataires/${params.id}`),
          api.get(`/commandes/prestataire/${params.id}/recentes`).catch(() => ({ data: [] })),
        ]);
        
        const prestataireData = prestataireRes.data;
        console.log('✅ Données prestataire récupérées:', {
          id: prestataireData?.id,
          raisonSociale: prestataireData?.raisonSociale,
          user: {
            address: prestataireData?.user?.address,
            latitude: prestataireData?.user?.latitude,
            longitude: prestataireData?.user?.longitude,
            phone: prestataireData?.user?.phone,
          },
          localisation: prestataireData?.localisation,
        });
        
        if (!prestataireData) {
          setError('Prestataire non trouvé');
          return;
        }
        
        setPrestataire(prestataireData);
        setPrestationsRecent(prestationsRes.data || []);
      } catch (error: any) {
        console.error('❌ Erreur récupération données:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors du chargement du prestataire';
        setError(errorMessage);
        if (error?.response?.status === 404) {
          setError('Prestataire non trouvé ou compte inactif');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    } else {
      setError('ID du prestataire manquant');
      setLoading(false);
    }
  }, [params.id]);

  // Calcul de la distance et durée
  useEffect(() => {
    const calculateDistanceAndDuration = async () => {
      const prestataireLat = prestataire?.user?.latitude || (prestataire?.localisation ? prestataire.localisation.coordinates[1] : null);
      const prestataireLng = prestataire?.user?.longitude || (prestataire?.localisation ? prestataire.localisation.coordinates[0] : null);
      
      console.log('📍 Vérification coordonnées:', {
        userLocation,
        prestataireLat,
        prestataireLng,
        prestataireUser: {
          latitude: prestataire?.user?.latitude,
          longitude: prestataire?.user?.longitude,
          address: prestataire?.user?.address,
        },
        prestataireLocalisation: prestataire?.localisation,
      });
      
      if (!userLocation) {
        console.warn('⚠️ Position utilisateur non disponible');
        setDistance(null);
        setDuration(null);
        setCalculatingRoute(false);
        return;
      }
      
      if (!prestataireLat || !prestataireLng) {
        console.warn('⚠️ Coordonnées prestataire non disponibles:', {
          hasUserLat: !!prestataire?.user?.latitude,
          hasUserLng: !!prestataire?.user?.longitude,
          hasLocalisation: !!prestataire?.localisation,
        });
        setDistance(null);
        setDuration(null);
        setCalculatingRoute(false);
        return;
      }
      
      console.log('🔄 Calcul distance/durée en cours...');
      setCalculatingRoute(true);
      try {
        // Vérifier que les coordonnées sont valides
        if (isNaN(userLocation[0]) || isNaN(userLocation[1]) || isNaN(prestataireLat) || isNaN(prestataireLng)) {
          console.error('❌ Coordonnées invalides:', { userLocation, prestataireLat, prestataireLng });
          setDistance(null);
          setDuration(null);
          setCalculatingRoute(false);
          return;
        }

        // Format OSRM: lng,lat (longitude, latitude)
        const origin = `${userLocation[1]},${userLocation[0]}`;
        const destination = `${prestataireLng},${prestataireLat}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=false&alternatives=false`;
        
        console.log('🌐 Appel OSRM:', { 
          origin, 
          destination, 
          userLocation: `[${userLocation[0]}, ${userLocation[1]}]`,
          prestataire: `[${prestataireLat}, ${prestataireLng}]`,
          url 
        });
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`OSRM API error: ${res.status}`);
        }
        
        const data = await res.json();
        
        console.log('📊 Réponse OSRM:', data);
        
        if (data?.code === 'Ok' && data?.routes?.[0]) {
          // Distance en mètres, convertir en km
          const distanceMeters = data.routes[0].distance;
          const distanceKm = distanceMeters / 1000;
          
          // Durée en secondes, convertir en minutes
          const durationSeconds = data.routes[0].duration;
          const durationMinutes = Math.ceil(durationSeconds / 60); // Arrondir vers le haut
          
          // Vérifier que les valeurs sont raisonnables (distance > 0, durée > 0)
          if (distanceKm > 0 && durationMinutes > 0) {
            setDistance(distanceKm);
            setDuration(durationMinutes);
            
            console.log('✅ Distance et durée calculées:', {
              distanceMeters,
              distance: `${distanceKm.toFixed(2)} km`,
              durationSeconds,
              duration: `${durationMinutes} min`,
            });
          } else {
            console.warn('⚠️ Valeurs calculées invalides:', { distanceKm, durationMinutes });
            setDistance(null);
            setDuration(null);
          }
        } else {
          console.warn('⚠️ Aucune route trouvée dans la réponse OSRM:', data);
          // Fallback: calcul de distance à vol d'oiseau (Haversine)
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const R = 6371; // Rayon de la Terre en km
          const dLat = toRad(prestataireLat - userLocation[0]);
          const dLon = toRad(prestataireLng - userLocation[1]);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(userLocation[0])) * Math.cos(toRad(prestataireLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = R * c;
          
          // Estimation de la durée basée sur la distance (vitesse moyenne de 15 km/h en ville)
          const durationMinutes = Math.ceil((distanceKm / 15) * 60);
          
          setDistance(distanceKm);
          setDuration(durationMinutes);
          
          console.log('✅ Distance et durée calculées (fallback Haversine):', {
            distance: `${distanceKm.toFixed(2)} km`,
            duration: `${durationMinutes} min`,
          });
        }
      } catch (e) {
        console.error('❌ Erreur calcul distance/durée:', e);
        // Fallback: calcul de distance à vol d'oiseau (Haversine)
        try {
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const R = 6371; // Rayon de la Terre en km
          const dLat = toRad(prestataireLat - userLocation[0]);
          const dLon = toRad(prestataireLng - userLocation[1]);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(userLocation[0])) * Math.cos(toRad(prestataireLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = R * c;
          
          // Estimation de la durée basée sur la distance (vitesse moyenne de 15 km/h en ville)
          const durationMinutes = Math.ceil((distanceKm / 15) * 60);
          
          setDistance(distanceKm);
          setDuration(durationMinutes);
          
          console.log('✅ Distance et durée calculées (fallback Haversine après erreur):', {
            distance: `${distanceKm.toFixed(2)} km`,
            duration: `${durationMinutes} min`,
          });
        } catch (fallbackError) {
          console.error('❌ Erreur même avec fallback:', fallbackError);
          setDistance(null);
          setDuration(null);
        }
      } finally {
        setCalculatingRoute(false);
      }
    };

    if (prestataire && userLocation) {
      calculateDistanceAndDuration();
    }
  }, [prestataire, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50 flex items-center justify-center">
        <div className="max-w-6xl mx-auto text-center w-full">
          <div className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-base sm:text-lg text-gray-700">Chargement du prestataire...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prestataire) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50 flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-0">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-red-800">Erreur</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">
                {error || 'Prestataire non trouvé'}
              </p>
              <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">
                {error?.includes('inactif') 
                  ? 'Ce prestataire n\'est pas actif ou son compte a été désactivé.'
                  : 'Le prestataire demandé n\'existe pas ou n\'est plus disponible.'}
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à l'accueil
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Bouton retour */}
        <div className="mb-2 sm:mb-0">
          <BackButton href="/" label="Retour à l'accueil" />
        </div>
        
        {/* En-tête */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl mb-2 text-gray-900 break-words">{prestataire.raisonSociale}</CardTitle>
                <CardDescription className="text-sm sm:text-base lg:text-lg text-gray-600 break-words">{prestataire.description}</CardDescription>
              </div>
              <div className="flex-shrink-0 self-start sm:self-auto">
                <img
                  src={
                    normalizeLogoUrl(prestataire.logoUrl, prestataire.updatedAt) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`
                  }
                  alt={prestataire.raisonSociale}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full object-cover border flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(prestataire.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=128`;
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
              <RatingStars rating={prestataire.noteMoyenne || 0} showValue size="lg" />
              <span className="text-sm sm:text-base text-gray-600">
                {prestataire.nombreAvis || 0} avis
              </span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                prestataire.disponibilite
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Services proposés */}
            {prestataire.prestataireServices && prestataire.prestataireServices.length > 0 && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Services proposés</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {prestataire.prestataireServices.map((ps: any) => (
                      <div key={ps.id} className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{ps.service.nom}</p>
                          {ps.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{ps.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Travaux récents (galerie d'images) */}
            {prestataire.travauxRecents && prestataire.travauxRecents.length > 0 ? (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Travaux récents</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Quelques exemples de réalisations récentes du prestataire
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {prestataire.travauxRecents.map((work: any) => {
                      const imageSrc = normalizeImageUrl(work.imageUrl, work.createdAt);
                      return (
                        <div
                          key={work.id}
                          onClick={() => setSelectedTravail(work)}
                          className="relative rounded-lg overflow-hidden bg-gray-100 border hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <img
                            src={imageSrc || 'https://via.placeholder.com/300x300?text=Image+non+disponible'}
                            alt={work.titre || 'Travail récent'}
                            className="w-full h-24 sm:h-32 md:h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('placeholder')) return;
                              target.src = 'https://via.placeholder.com/300x300?text=Image+non+disponible';
                            }}
                          />
                          {/* Overlay avec icône zoom au survol */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                              </svg>
                            </div>
                          </div>
                          {(work.titre || work.description) && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white px-2 py-2 text-xs md:text-sm">
                              <p className="font-medium line-clamp-1">{work.titre}</p>
                              {work.description && (
                                <p className="text-xs opacity-90 line-clamp-1 mt-0.5">{work.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Travaux récents</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Quelques exemples de réalisations récentes du prestataire
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <p className="text-xs sm:text-sm">Aucun travail récent disponible</p>
                    <p className="text-xs text-gray-400 mt-1">Le prestataire n'a pas encore ajouté de photos de ses réalisations</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prestations récentes */}
            {prestationsRecent.slice(0, 3).length > 0 && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Prestations récentes</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Dernières réalisations terminées
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {prestationsRecent.slice(0, 3).map((prestation: any, index: number) => (
                      <div key={prestation.id} className="border-b pb-3 sm:pb-4 last:border-b-0">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base text-gray-900 mb-1 break-words">
                              {prestation.demande?.service?.nom || 'Service'}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              {prestation.demande?.service?.sousSecteur?.secteur?.nom && (
                                <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs mr-2">
                                  {prestation.demande.service.sousSecteur.secteur.nom}
                                </span>
                              )}
                              {prestation.demande?.description && (
                                <span className="text-gray-600">
                                  {prestation.demande.description}
                                </span>
                              )}
                            </p>
                            {prestation.avis && (
                              <div className="flex items-center gap-2 mt-2">
                                <RatingStars rating={prestation.avis.note} size="sm" />
                                {prestation.avis.commentaire && (
                                  <p className="text-sm text-gray-600 italic">
                                    "{prestation.avis.commentaire}"
                                  </p>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 mt-2 block">
                              {new Date(prestation.updatedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {/* Photo demo à droite avec clic */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => setSelectedPrestation(prestation)}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={getDemoImageUrl(prestation, 'thumb', index)}
                                alt={prestation.demande?.service?.nom || 'Prestation'}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-gray-200 hover:border-primary transition-colors"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = getDemoImageUrl(prestation, 'thumb', index + 1);
                                }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dialog pour voir la réalisation */}
            <Dialog open={!!selectedPrestation} onOpenChange={(open) => !open && setSelectedPrestation(null)}>
              <DialogContent className="max-w-2xl">
                {selectedPrestation && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedPrestation.demande?.service?.nom || 'Prestation'}</DialogTitle>
                      <DialogDescription>
                        Réalisation du {new Date(selectedPrestation.updatedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <img
                          src={getDemoImageUrl(selectedPrestation, 'full', 0)}
                          alt={selectedPrestation.demande?.service?.nom || 'Prestation'}
                          className="w-full h-64 rounded-lg object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getDemoImageUrl(selectedPrestation, 'full', 1);
                          }}
                        />
                      </div>
                      <div>
                        {selectedPrestation.demande?.service?.sousSecteur?.secteur?.nom && (
                          <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded text-sm mr-2 mb-2">
                            {selectedPrestation.demande.service.sousSecteur.secteur.nom}
                          </span>
                        )}
                        {selectedPrestation.demande?.description && (
                          <p className="text-gray-700 mt-2">
                            {selectedPrestation.demande.description}
                          </p>
                        )}
                      </div>
                      {selectedPrestation.avis && (
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <RatingStars rating={selectedPrestation.avis.note} size="md" />
                            <span className="text-sm text-gray-600">Avis client</span>
                          </div>
                          {selectedPrestation.avis.commentaire && (
                            <p className="text-gray-700 italic">
                              "{selectedPrestation.avis.commentaire}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog pour zoomer sur un travail récent */}
            <Dialog open={!!selectedTravail} onOpenChange={(open) => !open && setSelectedTravail(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {selectedTravail && (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedTravail.titre || 'Travail récent'}</DialogTitle>
                      {selectedTravail.description && (
                        <DialogDescription>
                          {selectedTravail.description}
                        </DialogDescription>
                      )}
                      {selectedTravail.createdAt && (
                        <DialogDescription className="text-xs text-gray-500">
                          Ajouté le {new Date(selectedTravail.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </DialogDescription>
                      )}
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative w-full">
                        <img
                          src={normalizeImageUrl(selectedTravail.imageUrl, selectedTravail.createdAt) || 'https://via.placeholder.com/800x600?text=Image+non+disponible'}
                          alt={selectedTravail.titre || 'Travail récent'}
                          className="w-full h-auto rounded-lg object-contain max-h-[70vh] mx-auto"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('placeholder')) return;
                            target.src = 'https://via.placeholder.com/800x600?text=Image+non+disponible';
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4 sm:space-y-6">
            {/* Distance et Durée */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-gray-900">Distance et Durée</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Informations de trajet
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {!userLocation ? (
                  <div className="text-center py-3 sm:py-4 space-y-2 sm:space-y-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400"
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
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium mb-1">
                      Géolocalisation requise
                    </p>
                    <p className="text-xs text-gray-500">
                      Autorisez l'accès à votre position pour voir la distance et la durée du trajet
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Vérifiez les paramètres de votre navigateur si la demande n'apparaît pas
                    </p>
                  </div>
                ) : calculatingRoute ? (
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 py-3 sm:py-4">
                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Calcul en cours...</span>
                  </div>
                ) : distance !== null && duration !== null ? (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Distance */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                          {distance < 1 
                            ? `${Math.round(distance * 1000)} m` 
                            : `${distance.toFixed(1)} km`}
                        </p>
                      </div>
                    </div>

                    {/* Durée */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Durée du trajet</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                          {duration < 60 
                            ? `${duration} min` 
                            : `${Math.floor(duration / 60)}h ${duration % 60}min`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 sm:py-4 space-y-2">
                    <p className="text-xs sm:text-sm text-gray-700 font-medium">
                      Distance et durée non disponibles
                    </p>
                    <p className="text-xs text-gray-500">
                      {!prestataire?.user?.latitude && !prestataire?.user?.longitude && !prestataire?.localisation
                        ? 'Les coordonnées du prestataire ne sont pas disponibles'
                        : 'Vérifiez que la géolocalisation est activée'}
                    </p>
                  </div>
                )}

                {/* Adresse supprimée de cette section */}
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-gray-900">Contact</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                {/* Téléphone supprimé de cette section */}
                {prestataire.user?.address && (
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2"><strong>Adresse:</strong></p>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">{prestataire.user.address}</p>
                  </div>
                )}
                {/* Bouton WhatsApp direct (affiche si user existe; gère le numéro à l'intérieur) */}
                <a
                  href={prestataire.user ? getWhatsAppLink(prestataire.user.phone, `Bonjour, je vous contacte via VBS pour votre service.`) : '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-opacity font-medium shadow-sm text-xs sm:text-sm ${prestataire.user?.phone ? 'bg-[#25D366] text-white hover:opacity-90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                  aria-disabled={!prestataire.user?.phone}
                >
                  {/* WhatsApp icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-current" aria-hidden>
                    <path d="M.057 24l1.687-6.163a10.9 10.9 0 01-1.6-5.71C.144 5.281 5.403 0 12.057 0c3.162 0 6.126 1.233 8.367 3.472a11.77 11.77 0 013.47 8.385c-.003 6.654-5.262 11.912-11.917 11.912a11.9 11.9 0 01-5.695-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.593 5.448 0 9.886-4.434 9.889-9.882.002-5.462-4.415-9.89-9.881-9.893-5.452 0-9.887 4.43-9.889 9.882 0 2.225.651 3.891 1.746 5.555l-.999 3.648 3.742-.903zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.476-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.205-.242-.58-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.694.248-1.289.173-1.412z"/>
                  </svg>
                  Contacter sur WhatsApp
                </a>
                <ContactPrestataireButton prestataire={prestataire} size="full" />
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Appelez directement le prestataire. Connectez-vous pour suivre vos commandes et laisser des avis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
