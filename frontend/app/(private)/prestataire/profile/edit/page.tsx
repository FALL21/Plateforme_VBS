'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastSuccess, toastError, toastWarning } from '@/lib/toast';
import BackButton from '@/components/BackButton';

type Step = 'info' | 'services' | 'works' | 'contact';

export default function EditPrestataireProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    raisonSociale: '',
    description: '',
    logoUrl: '',
    disponibilite: true,
  });
  const [uploading, setUploading] = useState(false);
  const [logoVersion, setLogoVersion] = useState<number | null>(null);
  const [travauxRecents, setTravauxRecents] = useState<any[]>([]);
  const [workUploading, setWorkUploading] = useState(false);
  const [contact, setContact] = useState({
    email: '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });
  const [secteurs, setSecteurs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  const [selectedSecteurId, setSelectedSecteurId] = useState<string | null>(null);
  const [travailToDelete, setTravailToDelete] = useState<string | null>(null);

  const steps: { id: Step; label: string; description: string }[] = [
    { id: 'info', label: 'Informations', description: 'Identité et description' },
    { id: 'services', label: 'Services', description: 'Services proposés' },
    { id: 'works', label: 'Travaux', description: 'Réalisations récentes' },
    { id: 'contact', label: 'Contact', description: 'Coordonnées et localisation' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const getPublicApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return raw.replace(/\/?api\/?$/, '');
  };

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'PRESTATAIRE') {
      router.push('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/prestataires/mon-profil');
        const p = res.data;
        setForm({
          raisonSociale: p.raisonSociale || '',
          description: p.description || '',
          logoUrl: p.logoUrl || '',
          disponibilite: !!p.disponibilite,
        });
        setLogoVersion(p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now());
        setTravauxRecents(p.travauxRecents || []);

        const currentServiceIds = (p.prestataireServices || []).map((ps: any) => ps.serviceId);
        setSelectedServiceIds(currentServiceIds);

        try {
          const me = await api.get('/users/me');
          setContact({
            email: me.data?.email || '',
            phone: me.data?.phone || '',
            address: me.data?.address || '',
            latitude: me.data?.latitude || 0,
            longitude: me.data?.longitude || 0,
          });
        } catch {}

        try {
          const secteursRes = await api.get('/secteurs');
          setSecteurs(secteursRes.data || []);

          const allServices: any[] = [];
          for (const secteur of secteursRes.data || []) {
            try {
              const sousSecteursRes = await api.get(`/secteurs/${secteur.id}/sous-secteurs`);
              for (const sousSecteur of sousSecteursRes.data || []) {
                try {
                  const servicesRes = await api.get('/services', {
                    params: { sousSecteur: sousSecteur.id },
                  });
                  allServices.push(...(servicesRes.data || []));
                } catch {}
              }
            } catch {}
          }
          const uniqueServices = Array.from(new Map(allServices.map((s) => [s.id, s])).values());
          setServices(uniqueServices);
        } catch (e) {
          console.error('Erreur chargement secteurs/services:', e);
        }
      } catch (e: any) {
        if (e?.response?.status === 404) {
          toastWarning('Profil non trouvé', 'Créez votre profil prestataire pour continuer.');
          router.push('/prestataire/create');
        } else {
          toastError('Erreur', 'Impossible de charger le profil. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/prestataires/me', {
        raisonSociale: form.raisonSociale,
        description: form.description,
        logoUrl: form.logoUrl || undefined,
        disponibilite: form.disponibilite,
      });
      setLogoVersion(Date.now());
      toastSuccess('Profil mis à jour', 'Vos modifications ont été enregistrées avec succès.');
      router.refresh();
    } catch (e: any) {
      toastError('Erreur', e?.response?.data?.message || 'Impossible de mettre à jour le profil. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        address: contact.address,
        latitude: contact.latitude,
        longitude: contact.longitude,
      });
      toastSuccess('Coordonnées mises à jour', 'Vos coordonnées ont été enregistrées.');
      router.refresh();
    } catch (e: any) {
      toastError('Erreur', e?.response?.data?.message || 'Impossible de mettre à jour les coordonnées.');
    } finally {
      setSaving(false);
    }
  };

  const handleUseGeolocation = () => {
    if (!('geolocation' in navigator)) {
      toastWarning('Géolocalisation non disponible', 'Votre navigateur ne supporte pas la géolocalisation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setContact((c) => ({ ...c, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        toastSuccess('Position détectée', 'Votre position a été récupérée avec succès.');
      },
      () => toastError('Erreur', 'Impossible de récupérer votre position. Vérifiez les permissions de votre navigateur.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url;
      if (url) {
        setForm((prev) => ({ ...prev, logoUrl: url }));
        try {
          await api.patch('/prestataires/me', { logoUrl: url });
          setLogoVersion(Date.now());
          router.refresh();
        } catch (e) {}
      }
    } catch (e: any) {
      toastError('Erreur', e?.response?.data?.message || 'Impossible de téléverser le logo. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkImageUpload = async (file: File, travailId?: string) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Erreur', 'Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('Erreur', "L'image est trop volumineuse. Taille maximale : 5MB");
      return;
    }

    setWorkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url;
      if (url) {
        let travauxRes;
        if (travailId) {
          travauxRes = await api.patch(`/prestataires/travaux/${travailId}`, {
            imageUrl: url,
          });
          toastSuccess('Image remplacée', "L'image a été remplacée avec succès.");
        } else {
          travauxRes = await api.post('/prestataires/travaux', {
            imageUrl: url,
          });
          toastSuccess('Travail ajouté', 'Votre travail récent a été ajouté avec succès.');
        }
        setTravauxRecents(travauxRes.data || []);
      }
    } catch (e: any) {
      console.error('Erreur ajout/remplacement travail récent:', e);
      toastError('Erreur', e?.response?.data?.message || "Impossible d'ajouter le travail récent. Veuillez réessayer.");
    } finally {
      setWorkUploading(false);
    }
  };

  const handleDeleteTravail = async () => {
    if (!travailToDelete) return;

    try {
      const travauxRes = await api.delete(`/prestataires/travaux/${travailToDelete}`);
      setTravauxRecents(travauxRes.data || []);
      setTravailToDelete(null);
      toastSuccess('Image supprimée', "L'image a été supprimée avec succès.");
    } catch (e: any) {
      console.error('Erreur suppression travail récent:', e);
      toastError('Erreur', e?.response?.data?.message || "Impossible de supprimer l'image. Veuillez réessayer.");
      setTravailToDelete(null);
    }
  };

  const handleSaveServices = async () => {
    setSavingServices(true);
    try {
      await api.patch('/prestataires/me/services', {
        serviceIds: selectedServiceIds,
      });
      toastSuccess('Services mis à jour', 'Vos services ont été modifiés avec succès.');
      router.refresh();
    } catch (e: any) {
      toastError('Erreur', e?.response?.data?.message || 'Impossible de mettre à jour les services. Veuillez réessayer.');
    } finally {
      setSavingServices(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const normalizeLogoUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    let normalized = url.replace(/\/+/g, '/');
    const base = getPublicApiBase();
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    if (normalized.startsWith('/api/files/')) {
      return `${base}${normalized}`;
    }
    if (normalized.startsWith('/files/')) {
      return `${base}/api${normalized}`;
    }
    if (normalized.startsWith('/')) {
      return `${base}${normalized}`;
    }
    return `${base}/api/files/${normalized}`;
  };

  const normalizeImageUrl = (url: string | undefined, updatedAt?: string | Date): string | undefined => {
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

  const logoSrc = useMemo(() => {
    const base = normalizeLogoUrl(form.logoUrl);
    if (!base) return undefined;
    const version = logoVersion ?? Date.now();
    return `${base}${base.includes('?') ? '&' : '?'}v=${version}`;
  }, [form.logoUrl, logoVersion]);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleFinalSave = async () => {
    await Promise.all([handleSave(), handleSaveContact()]);
    router.push('/prestataire/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <BackButton href="/prestataire/dashboard" label="Retour au dashboard" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mt-4 sm:mt-6">
            Modifier mon profil
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Mettez à jour vos informations pour améliorer votre visibilité
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 overflow-x-auto">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1"
                  >
                    <div className="flex flex-col items-center gap-2 min-w-0 flex-1">
                      <button
                        onClick={() => setCurrentStep(step.id)}
                        className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-semibold text-sm sm:text-base transition-all ${
                          isActive
                            ? 'bg-primary text-white shadow-lg scale-110'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </button>
                      <div className="text-center min-w-0">
                        <p className={`text-xs sm:text-sm font-medium ${
                          isActive ? 'text-primary' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`hidden sm:block flex-1 h-0.5 mx-2 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 sm:p-6 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">
              {steps[currentStepIndex].label}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {steps[currentStepIndex].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Step 1: Informations */}
            {currentStep === 'info' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Logo */}
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <div className="relative">
                    <img
                      src={
                        logoSrc ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(form.raisonSociale || 'P')}&background=0D8ABC&color=fff&size=200`
                      }
                      alt="Logo"
                      className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://ui-avatars.com/api/?name=P&background=0D8ABC&color=fff&size=200';
                      }}
                    />
                    <label className="absolute -bottom-2 -right-2 cursor-pointer bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Téléversement en cours...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700">
                    Raison sociale *
                  </label>
                  <Input
                    value={form.raisonSociale}
                    onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                    className="text-sm sm:text-base"
                    placeholder="Nom de votre entreprise ou service"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700">
                    Description *
                  </label>
                  <textarea
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg min-h-[120px] sm:min-h-[150px] text-sm sm:text-base focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez votre activité, vos spécialités et ce qui vous différencie..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    id="disponibilite"
                    type="checkbox"
                    checked={form.disponibilite}
                    onChange={(e) => setForm({ ...form, disponibilite: e.target.checked })}
                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                  />
                  <label htmlFor="disponibilite" className="text-sm sm:text-base font-medium text-gray-700 cursor-pointer">
                    Je suis disponible pour recevoir des demandes
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Services */}
            {currentStep === 'services' && (
              <div className="space-y-4 sm:space-y-6">
                <p className="text-sm sm:text-base text-gray-600">
                  Sélectionnez les services que vous proposez. Les clients pourront vous trouver en fonction de ces services.
                </p>

                {secteurs.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm sm:text-base font-semibold mb-3 text-gray-700">
                      Filtrer par secteur
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSecteurId(null)}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          selectedSecteurId === null
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Tous
                      </button>
                      {secteurs.map((secteur) => {
                        const secteurServices = services.filter(
                          (s) => s.sousSecteur?.secteurId === secteur.id
                        );
                        if (secteurServices.length === 0) return null;

                        const selectedCount = secteurServices.filter((s) =>
                          selectedServiceIds.includes(s.id)
                        ).length;

                        return (
                          <button
                            key={secteur.id}
                            onClick={() => setSelectedSecteurId(secteur.id)}
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                              selectedSecteurId === secteur.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {secteur.nom}
                            {selectedCount > 0 && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                                selectedSecteurId === secteur.id
                                  ? 'bg-white/20 text-white'
                                  : 'bg-primary text-white'
                              }`}>
                                {selectedCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {services.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      const secteursToShow = selectedSecteurId
                        ? secteurs.filter((s) => s.id === selectedSecteurId)
                        : secteurs;

                      return secteursToShow.map((secteur) => {
                        const secteurServices = services.filter(
                          (s) => s.sousSecteur?.secteurId === secteur.id
                        );
                        if (secteurServices.length === 0) return null;

                        return (
                          <div key={secteur.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
                            <h4 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {secteur.nom}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {secteurServices.map((service) => {
                                const isSelected = selectedServiceIds.includes(service.id);
                                return (
                                  <label
                                    key={service.id}
                                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-primary/10 border-primary border-2 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleService(service.id)}
                                      className="rounded w-4 h-4 sm:w-5 sm:h-5 text-primary focus:ring-primary"
                                    />
                                    <span className={`text-sm sm:text-base flex-1 ${
                                      isSelected ? 'font-semibold text-primary' : 'text-gray-700'
                                    }`}>
                                      {service.nom}
                                    </span>
                                    {isSelected && (
                                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {selectedServiceIds.length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm sm:text-base text-blue-800 font-medium">
                          <strong>{selectedServiceIds.length}</strong> service{selectedServiceIds.length > 1 ? 's' : ''} sélectionné{selectedServiceIds.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleSaveServices}
                      disabled={savingServices}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {savingServices ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Enregistrer les services
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm sm:text-base text-gray-600">Chargement des services...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Travaux récents */}
            {currentStep === 'works' && (
              <div className="space-y-4 sm:space-y-6">
                <p className="text-sm sm:text-base text-gray-600">
                  Ajoutez des photos de vos réalisations récentes pour montrer la qualité de votre travail et rassurer vos clients.
                </p>

                {travauxRecents && travauxRecents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {travauxRecents.map((work) => {
                      const imageSrc = normalizeImageUrl(work.imageUrl, work.updatedAt || work.createdAt);
                      return (
                        <div
                          key={work.id}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 group shadow-sm hover:shadow-md transition-shadow"
                        >
                          <img
                            src={imageSrc || 'https://via.placeholder.com/300x300?text=Image'}
                            alt={work.titre || 'Travail récent'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('placeholder')) return;
                              target.src = 'https://via.placeholder.com/300x300?text=Image';
                            }}
                          />
                          {work.titre && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {work.titre}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg" title="Remplacer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleWorkImageUpload(e.target.files[0], work.id);
                                    e.target.value = '';
                                  }
                                }}
                                disabled={workUploading}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => setTravailToDelete(work.id)}
                              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                              title="Supprimer"
                              disabled={workUploading}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center bg-gray-50">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm sm:text-base text-gray-600 mb-2">Aucun travail récent ajouté</p>
                    <p className="text-xs sm:text-sm text-gray-500">Ajoutez des photos pour montrer vos réalisations</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer">
                    <span className={`px-6 py-3 rounded-lg transition-all inline-flex items-center gap-2 font-medium ${
                      workUploading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {workUploading ? 'Envoi en cours...' : 'Ajouter une photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleWorkImageUpload(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      disabled={workUploading}
                      className="hidden"
                    />
                  </label>
                  {workUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Téléversement en cours...
                    </div>
                  )}
                </div>
                {travauxRecents && travauxRecents.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-500 text-center">
                    {travauxRecents.length} photo{travauxRecents.length > 1 ? 's' : ''} ajoutée{travauxRecents.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Contact */}
            {currentStep === 'contact' && (
              <div className="space-y-4 sm:space-y-6">
                <p className="text-sm sm:text-base text-gray-600">
                  Vos coordonnées permettent aux clients de vous contacter et de vous localiser.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="email@exemple.com"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Téléphone
                    </label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="+221 XX XXX XX XX"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Adresse
                    </label>
                    <Input
                      value={contact.address}
                      onChange={(e) => setContact({ ...contact, address: e.target.value })}
                      placeholder="Votre adresse complète"
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="sm:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm sm:text-base font-semibold mb-3 text-gray-700">
                      Coordonnées GPS (pour la localisation)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-600">Latitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={contact.latitude}
                          onChange={(e) => setContact({ ...contact, latitude: parseFloat(e.target.value) || 0 })}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-600">Longitude</label>
                        <Input
                          type="number"
                          step="any"
                          value={contact.longitude}
                          onChange={(e) => setContact({ ...contact, longitude: parseFloat(e.target.value) || 0 })}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleUseGeolocation}
                      className="mt-3 w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Utiliser ma position actuelle
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Enregistrer les coordonnées
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </Button>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 order-1 sm:order-2">
                Étape {currentStepIndex + 1} sur {steps.length}
              </div>

              {currentStepIndex < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  className="w-full sm:w-auto order-3"
                  size="lg"
                >
                  Suivant
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSave}
                  disabled={saving}
                  className="w-full sm:w-auto order-3"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Terminer et sauvegarder
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de confirmation de suppression */}
        {travailToDelete && (
          <ConfirmDialog
            open={!!travailToDelete}
            onOpenChange={(open) => !open && setTravailToDelete(null)}
            title="Supprimer l'image"
            description="Êtes-vous sûr de vouloir supprimer cette image de vos travaux récents ? Cette action est irréversible."
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="destructive"
            onConfirm={handleDeleteTravail}
            icon={
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}
