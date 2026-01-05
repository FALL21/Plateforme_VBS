'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import AuthModal from '@/components/AuthModal';
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface Secteur {
  id: string;
  nom: string;
}

interface SousSecteur {
  id: string;
  nom: string;
  secteurId: string;
}

interface Service {
  id: string;
  nom: string;
  sousSecteurId: string;
}

export default function CreatePrestatairePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Données du formulaire
  const [formData, setFormData] = useState({
    raisonSociale: '',
    description: '',
    telephone: '',
    email: '',
    address: '',
    latitude: 14.7167,
    longitude: -17.4677,
    secteurs: [] as string[],
    services: [] as string[],
    logoUrl: '',
  });

  // Données pour les sélections
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sousSecteurs, setSousSecteurs] = useState<SousSecteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customServices, setCustomServices] = useState<{ name: string; sousSecteurId: string | null }[]>([]);
  const [customServiceName, setCustomServiceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const geocodeTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const isAuth = isAuthenticated();

  const getPublicApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return raw.replace(/\/?api\/?$/, '');
  };

  const normalizeLogoUrl = (url?: string | null, options?: { cacheBust?: boolean }) => {
    if (!url) return null;
    const { cacheBust = false } = options || {};
    let normalized = url.replace('/api/files//', '/api/files/');
    const base = getPublicApiBase();

    if (/^https?:\/\//i.test(normalized)) {
      return cacheBust ? `${normalized}${normalized.includes('?') ? '&' : '?'}v=${Date.now()}` : normalized;
    }

    if (normalized.startsWith('/api/files') || normalized.startsWith('/files/')) {
      const full = `${base}${normalized}`;
      return cacheBust ? `${full}${full.includes('?') ? '&' : '?'}v=${Date.now()}` : full;
    }

    return cacheBust ? `${normalized}${normalized.includes('?') ? '&' : '?'}v=${Date.now()}` : normalized;
  };

  const normalizePhone = (raw: string) => {
    if (!raw) return raw;
    let value = raw.trim();
    if (value.startsWith('00')) {
      value = `+${value.slice(2)}`;
    }
    if (value.startsWith('0')) {
      const defaultCountry = '+221';
      value = `${defaultCountry}${value.slice(1)}`;
    }
    if (!value.startsWith('+')) {
      value = `+${value}`;
    }
    value = value.replace(/\s+/g, '');
    return value;
  };

  useEffect(() => {
    setLogoPreview(normalizeLogoUrl(formData.logoUrl, { cacheBust: true }));
  }, [formData.logoUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('prestataire-create-draft');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
        if (Array.isArray(parsed.customServices)) {
          setCustomServices(
            parsed.customServices.map((item: any) => {
              if (typeof item === 'string') {
                return { name: item, sousSecteurId: null };
              }
              return {
                name: item?.name || item?.nom || '',
                sousSecteurId: item?.sousSecteurId ?? null,
              };
            }),
          );
        }
      }
    } catch (error) {
      console.warn('Impossible de charger le brouillon prestataire', error);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const initialize = async () => {
      if (!isAuth) {
        setInitialized(true);
        return;
      }

    // Préremplir avec les infos du compte
      const prefillFromUser = async () => {
        try {
          // 1) données du store (rapide)
          if (user) {
            setFormData((prev) => ({
              ...prev,
              telephone: (user as any).phone ?? prev.telephone,
              email: (user as any).email ?? prev.email,
              address: (user as any).address ?? prev.address,
              latitude:
                typeof (user as any).latitude === 'number'
                  ? (user as any).latitude
                  : prev.latitude ?? 14.7167,
              longitude:
                typeof (user as any).longitude === 'number'
                  ? (user as any).longitude
                  : prev.longitude ?? -17.4677,
            }));
            setUserProfile((prevProfile: any) => ({
              ...(prevProfile || {}),
              ...user,
            }));
          }
          // 2) rafraîchir depuis l'API (source de vérité) – essayer plusieurs endpoints
          let u: any = {};
          const endpoints = ['/users/me', '/auth/me', '/me'];
          for (const ep of endpoints) {
            try {
              const r = await api.get(ep);
          if (r?.data) {
            u = r.data;
            break;
          }
            } catch (_) { /* essayer suivant */ }
          }
          if (u && Object.keys(u).length > 0) {
          setFormData((prev) => ({
            ...prev,
              telephone: u.phone ?? prev.telephone,
              email: u.email ?? prev.email,
              address: u.address ?? prev.address,
              latitude:
                typeof u.latitude === 'number' ? u.latitude : prev.latitude ?? 14.7167,
              longitude:
                typeof u.longitude === 'number' ? u.longitude : prev.longitude ?? -17.4677,
          }));
            setUserProfile((prevProfile: any) => ({
              ...(prevProfile || {}),
              ...u,
            }));
          }
        } catch (_) {
          // ignore si endpoint non disponible
        }
      };
      await prefillFromUser();

      // Charger les secteurs
      const fetchSecteurs = async () => {
        try {
          try {
            const myProfile = await api.get('/prestataires/me');
            if (myProfile?.data?.id) {
              alert('Vous avez déjà un profil prestataire.');
              setInitialized(true);
              router.push('/prestataire');
              return true;
            }
          } catch (error: any) {
            const status = error?.response?.status;
            if (status !== 404) {
              throw error;
            }
          }
          const response = await api.get('/secteurs');
          setSecteurs(response.data || []);
        } catch (error) {
          console.error('Erreur chargement secteurs:', error);
        }
        return false;
      };
      const redirected = await fetchSecteurs();
      if (!redirected) {
        setInitialized(true);
      }
    };

    initialize();
  }, [isAuth, router, user, draftLoaded]);

  // Charger les sous-secteurs et services quand un secteur est sélectionné
  useEffect(() => {
    if (!isAuth) return;
    if (formData.secteurs.length > 0) {
      const fetchData = async () => {
        try {
          const allSousSecteurs: SousSecteur[] = [];
          const allServices: Service[] = [];
          for (const secteurId of formData.secteurs) {
            const sousSecteursRes = await api.get(`/secteurs/${secteurId}/sous-secteurs`);
            const sousSecteursData: SousSecteur[] = sousSecteursRes.data || [];
            allSousSecteurs.push(...sousSecteursData);

            for (const ss of sousSecteursData) {
              const servicesRes = await api.get('/services', {
                params: { sousSecteur: ss.id },
              });
              allServices.push(...(servicesRes.data || []));
            }
          }

          const uniqueServices = Array.from(new Map(allServices.map((s) => [s.id, s])).values());

          setSousSecteurs(allSousSecteurs);
          setServices(uniqueServices);
          setCustomServiceName('');
        } catch (error) {
          console.error('Erreur chargement données:', error);
        }
      };
      fetchData();
    } else {
      setSousSecteurs([]);
      setServices([]);
    }
  }, [formData.secteurs, isAuth]);

  useEffect(() => {
    if (!draftLoaded || typeof window === 'undefined') return;
    try {
      const payload = { formData, customServices };
      localStorage.setItem('prestataire-create-draft', JSON.stringify(payload));
    } catch (error) {
      console.warn("Impossible d'enregistrer le brouillon prestataire", error);
    }
  }, [formData, customServices, draftLoaded]);

  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      alert("Votre navigateur ne supporte pas la caméra.");
      setCameraOpen(false);
      return;
    }
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Erreur accès caméra', error);
        alert("Impossible d'accéder à la caméra.");
        setCameraOpen(false);
      }
    })();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  useEffect(() => {
    if (!draftLoaded || typeof window === 'undefined') return;
    const query = formData.address?.trim();
    if (!query || query.length < 3) {
      if (geocodeTimeout.current) {
        clearTimeout(geocodeTimeout.current);
      }
      setGeocoding(false);
      return;
    }
    if (geocodeTimeout.current) {
      clearTimeout(geocodeTimeout.current);
    }
    geocodeTimeout.current = setTimeout(async () => {
      try {
        setGeocoding(true);
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          addressdetails: '1',
          limit: '1',
          countrycodes: 'sn',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'VBS-Platform/1.0 (support@vosbesoinsservices.com)',
          },
        });
        if (!response.ok) throw new Error('Geocoding failed');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const { lat, lon } = data[0];
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          }));
        }
      } catch (error) {
        console.warn('Geocoding adresse impossible', error);
      } finally {
        setGeocoding(false);
      }
    }, 800) as unknown as NodeJS.Timeout;

    return () => {
      if (geocodeTimeout.current) {
        clearTimeout(geocodeTimeout.current);
      }
    };
  }, [formData.address, draftLoaded, geocodeTimeout]);

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Devenir prestataire</CardTitle>
            <CardDescription>Connectez-vous ou créez un compte pour poursuivre la création de votre profil prestataire.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => setAuthModalOpen(true)}>Connexion ou inscription</Button>
            <p className="text-xs text-gray-500 text-center">Vous pourrez compléter votre profil en quelques étapes après connexion.</p>
          </CardContent>
        </Card>
        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          redirectTo="/prestataire/create"
        />
      </div>
    );
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        try {
          setGeocoding(true);
          const params = new URLSearchParams({
            format: 'json',
            lat: latitude.toString(),
            lon: longitude.toString(),
            addressdetails: '1',
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
              'Accept-Language': 'fr',
              'User-Agent': 'VBS-Platform/1.0 (support@vosbesoinsservices.com)',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.display_name) {
              setFormData((prev) => ({ ...prev, address: data.display_name }));
            }
          }
        } catch (error) {
          console.warn('Reverse geocoding failed', error);
        } finally {
          setGeocoding(false);
        }
      },
      (error) => {
        console.error('Erreur géolocalisation', error);
        alert("Impossible de récupérer votre position.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.url as string | undefined;
      if (url) {
        setFormData((prev) => ({ ...prev, logoUrl: url }));
        const normalized = normalizeLogoUrl(url, { cacheBust: true });
        if (normalized) {
          setLogoPreview(normalized);
        }
        return normalized;
      }
    } catch (error: any) {
      console.error('Erreur upload logo', error);
      alert(error.response?.data?.message || 'Impossible de téléverser la photo');
    } finally {
      setLogoUploading(false);
    }
    return null;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    const uploadedUrl = await uploadLogo(file);
    if (!uploadedUrl) {
      // garder l'aperçu local quelques instants en cas d'erreur
      setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
    } else {
      URL.revokeObjectURL(localUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const previewData = canvas.toDataURL('image/jpeg');
      setLogoPreview(previewData);
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      await uploadLogo(file);
      closeCamera();
    }, 'image/jpeg', 0.9);
  };


  const handleAddCustomService = () => {
    const value = customServiceName.trim();
    if (!value) return;
    if (customServices.some((service) => service.name.toLowerCase() === value.toLowerCase())) return;

    const primarySecteurId = formData.secteurs[0];
    if (!primarySecteurId) {
      alert('Sélectionnez au moins un secteur avant d’ajouter un service personnalisé.');
      return;
    }

    const matchingSousSecteurs = sousSecteurs.filter((ss) => ss.secteurId === primarySecteurId);
    const selectedSousSecteur = matchingSousSecteurs[0] ?? sousSecteurs[0] ?? null;
    if (!selectedSousSecteur) {
      alert('Aucun sous-secteur disponible pour créer ce service.');
      return;
    }

    setCustomServices((prev) => [...prev, { name: value, sousSecteurId: selectedSousSecteur.id }]);
    setCustomServiceName('');
  };

  const handleRemoveCustomService = (name: string) => {
    setCustomServices((prev) => prev.filter((item) => item.name !== name));
  };

  const handleSubmit = async () => {
    if (!isAuth) {
      setAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const userPayload: Record<string, unknown> = {};
      if (formData.address?.trim()) {
        userPayload.address = formData.address.trim();
      }
      if (typeof formData.latitude === 'number') {
        userPayload.latitude = formData.latitude;
      }
      if (typeof formData.longitude === 'number') {
        userPayload.longitude = formData.longitude;
      }
      if (formData.email?.trim()) {
        userPayload.email = formData.email.trim();
      }
      if (formData.telephone?.trim()) {
        userPayload.phone = normalizePhone(formData.telephone);
      }

      let userUpdateFailed = false;
      if (Object.keys(userPayload).length > 0) {
        try {
          await api.patch('/users/me', userPayload);
        } catch (error: any) {
          userUpdateFailed = true;
          const message = error?.response?.data?.message || error?.message || "Impossible de mettre à jour vos informations";
          alert(Array.isArray(message) ? message.join('\n') : message);
        }
      }

      if (userUpdateFailed) {
        setLoading(false);
        return;
      }

      const customNames = customServices.map((service) => service.name);
      const descriptionWithCustom = customNames.length
        ? `${formData.description}

Services personnalisés ajoutés : ${customNames.join(', ')}`
        : formData.description;

      // Respecter le DTO backend (whitelist): raisonSociale, description, logoUrl?, serviceIds[]
      await api.post('/prestataires', {
        raisonSociale: formData.raisonSociale,
        description: descriptionWithCustom,
        logoUrl: formData.logoUrl || undefined,
        serviceIds: formData.services,
        address: formData.address || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        email: formData.email?.trim() || undefined,
        phone: formData.telephone ? normalizePhone(formData.telephone) : undefined,
        customServices: customServices
          .filter((service) => !!service.sousSecteurId)
          .map((service) => ({ nom: service.name, sousSecteurId: service.sousSecteurId! })),
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('prestataire-create-draft');
      }
      router.push('/prestataire');
    } catch (error: any) {
      console.error('Erreur création prestataire:', error);
      const msg = error.response?.data?.message || error.message || 'Erreur lors de la création';
      if (msg.toString().includes('Unique') || msg.toString().includes('unique') || msg.toString().includes('already')) {
        alert('Vous avez déjà un profil prestataire.');
        router.push('/prestataire');
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSecteur = (secteurId: string) => {
    setFormData({
      ...formData,
      secteurs: formData.secteurs.includes(secteurId)
        ? formData.secteurs.filter((id) => id !== secteurId)
        : [...formData.secteurs, secteurId],
    });
  };

  const toggleService = (serviceId: string) => {
    setFormData({
      ...formData,
      services: formData.services.includes(serviceId)
        ? formData.services.filter((id) => id !== serviceId)
        : [...formData.services, serviceId],
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
          {userProfile && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Compte connecté</CardTitle>
                <CardDescription>
                  Ces informations ont été importées automatiquement depuis votre profil.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">
                    {formData.email || userProfile.email || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Téléphone</p>
                  <p className="font-medium">
                    {formData.telephone || userProfile.phone || 'Non renseigné'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Adresse</p>
                  <p className="font-medium">
                    {formData.address || userProfile.address || 'Non renseignée'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        <Card>
          <CardHeader>
            <CardTitle>Créer votre profil prestataire</CardTitle>
            <CardDescription>
              Étape {currentStep} sur {totalSteps}
            </CardDescription>
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Informations générales</h3>
                <Input
                  placeholder="Raison sociale *"
                  value={formData.raisonSociale}
                  onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description *"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md min-h-[100px]"
                  required
                />
                <Input
                  placeholder="Téléphone *"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  placeholder="Adresse"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleUseCurrentLocation}>
                    Utiliser ma position actuelle
                  </Button>
                  <span className="text-xs text-gray-500">
                    Cliquez sur la carte pour ajuster votre position ou saisissez l'adresse manuellement.
                  </span>
                </div>
                <div className="space-y-2">
                  {geocoding && (
                    <p className="text-xs text-blue-600">Recherche de la localisation…</p>
                  )}
                  <MapView
                    center={[formData.latitude, formData.longitude]}
                    markers={[{ position: [formData.latitude, formData.longitude], title: formData.raisonSociale || 'Position prestataire' }]}
                    onLocationSelect={handleLocationSelect}
                    className="rounded-lg h-64"
                  />
                  <p className="text-xs text-gray-500">
                    Latitude: {formData.latitude.toFixed(6)} – Longitude: {formData.longitude.toFixed(6)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!formData.raisonSociale || !formData.description || !formData.telephone}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Photo de profil</h3>
                <p className="text-sm text-gray-600">Ajoutez une photo professionnelle. Vous pouvez importer un fichier ou utiliser votre caméra.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-32 h-32 rounded-full border bg-gray-100 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500 text-center px-2">Aucun aperçu</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <span className="px-3 py-2 border rounded hover:bg-gray-50">Importer un fichier</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <Button type="button" variant="outline" onClick={() => setCameraOpen(true)}>Prendre une photo</Button>
                    {formData.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="justify-start text-red-500 hover:text-red-600"
                        onClick={handleRemoveLogo}
                      >
                        Supprimer la photo
                      </Button>
                    )}
                    {logoUploading && <span className="text-xs text-blue-600">Téléversement en cours…</span>}
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Précédent
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} disabled={logoUploading}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Secteurs et services</h3>
                
                <div>
                  <label className="block mb-2 font-medium">Secteurs *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {secteurs.map((secteur) => (
                      <label
                        key={secteur.id}
                        className={`p-3 border rounded cursor-pointer ${
                          formData.secteurs.includes(secteur.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.secteurs.includes(secteur.id)}
                          onChange={() => toggleSecteur(secteur.id)}
                          className="mr-2"
                        />
                        {secteur.nom}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.secteurs.length > 0 && services.length === 0 && (
                  <div className="p-4 border rounded bg-yellow-50 text-sm text-yellow-700">
                    Aucun service n'est disponible pour le secteur sélectionné. Vous pouvez proposer vos propres services ci-dessous.
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <label className="block mb-2 font-medium">Services proposés</label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {services.map((service) => (
                        <label
                          key={service.id}
                          className={`p-2 border rounded cursor-pointer text-sm ${
                            formData.services.includes(service.id)
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.services.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                            className="mr-2"
                          />
                          {service.nom}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-medium">Ajouter un service personnalisé</label>
                  <div className="flex gap-2">
                    <Input
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      placeholder="Nom du service"
                    />
                    <Button type="button" variant="outline" onClick={handleAddCustomService}>Ajouter</Button>
                  </div>
                  {customServices.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {customServices.map((name) => (
                        <span
                          key={name.name}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-2"
                        >
                          {name.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomService(name.name)}
                            className="text-primary hover:text-primary/80"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Précédent
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Création...' : 'Créer le profil'}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg space-y-4 p-6">
            <h3 className="text-lg font-semibold">Prendre une photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black aspect-video" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeCamera}>Annuler</Button>
              <Button type="button" onClick={handleCapturePhoto}>Capturer</Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

