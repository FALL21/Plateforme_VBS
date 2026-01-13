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

export default function EditPrestataireProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
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
        
        // Charger les services actuels du prestataire
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
        
        // Charger tous les secteurs et services disponibles
        try {
          const secteursRes = await api.get('/secteurs');
          setSecteurs(secteursRes.data || []);
          
          // Charger tous les services de tous les secteurs
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
      router.push('/prestataire/dashboard');
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
        // Mise à jour immédiate du formulaire (aperçu)
        setForm((prev) => ({ ...prev, logoUrl: url }));
        // Persister tout de suite côté backend pour que les autres pages voient le nouveau logo
        try {
          await api.patch('/prestataires/me', { logoUrl: url });
          setLogoVersion(Date.now());
          router.refresh();
        } catch (e) {
          // Laisser l'utilisateur enregistrer manuellement si la sauvegarde auto échoue
        }
      }
    } catch (e: any) {
      toastError('Erreur', e?.response?.data?.message || 'Impossible de téléverser le logo. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const handleWorkImageUpload = async (file: File, travailId?: string) => {
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toastError('Erreur', 'Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }
    
    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastError('Erreur', 'L\'image est trop volumineuse. Taille maximale : 5MB');
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
          // Remplacer un travail existant
          travauxRes = await api.patch(`/prestataires/travaux/${travailId}`, {
            imageUrl: url,
          });
          toastSuccess('Image remplacée', 'L\'image a été remplacée avec succès.');
        } else {
          // Ajouter un nouveau travail
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
      toastSuccess('Image supprimée', 'L\'image a été supprimée avec succès.');
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
    let normalized = url.replace(/\/+/g, '/'); // Supprime les slashes multiples
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

  if (loading) {
    return <div className="min-h-screen p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Modifier mon profil prestataire</CardTitle>
            <CardDescription>Mettez à jour vos informations de visibilité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Aperçu du logo si disponible */}
            {form.logoUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={logoSrc || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop'}
                  alt="Logo"
                  className="w-20 h-20 rounded-full object-cover border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop';
                  }}
                />
                <span className="text-sm text-gray-500">Aperçu</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Raison sociale</label>
              <Input
                value={form.raisonSociale}
                onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo (URL)</label>
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
              />
              <div className="flex items-center gap-3 mt-2">
                <input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])}
                />
                {uploading && <span className="text-xs text-gray-500">Téléversement...</span>}
              </div>
            </div>

            {/* Services proposés */}
            <div className="pt-4 border-t">
              <h3 className="text-base font-semibold mb-2">Services proposés</h3>
              <p className="text-xs text-gray-500 mb-4">
                Sélectionnez un secteur pour voir les services disponibles, puis choisissez ceux que vous proposez.
              </p>
              
              {/* Filtres par secteur */}
              {secteurs.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => setSelectedSecteurId(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSecteurId === null
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les secteurs
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
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                            selectedSecteurId === secteur.id
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {secteur.nom}
                          {selectedCount > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
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

              {/* Liste des services filtrés */}
              {services.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Filtrer les secteurs selon la sélection
                    const secteursToShow = selectedSecteurId
                      ? secteurs.filter((s) => s.id === selectedSecteurId)
                      : secteurs;

                    return secteursToShow.map((secteur) => {
                      const secteurServices = services.filter(
                        (s) => s.sousSecteur?.secteurId === secteur.id
                      );
                      if (secteurServices.length === 0) return null;

                      return (
                        <div key={secteur.id} className="border rounded-lg p-4 bg-white">
                          <h4 className="text-sm font-semibold mb-3 text-gray-900">{secteur.nom}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {secteurServices.map((service) => {
                              const isSelected = selectedServiceIds.includes(service.id);
                              return (
                                <label
                                  key={service.id}
                                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-primary/10 border-primary border-2'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleService(service.id)}
                                    className="rounded w-4 h-4 text-primary focus:ring-primary"
                                  />
                                  <span className={`text-sm flex-1 ${
                                    isSelected ? 'font-medium text-primary' : 'text-gray-700'
                                  }`}>
                                    {service.nom}
                                  </span>
                                  {isSelected && (
                                    <span className="text-primary text-xs">✓</span>
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
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>{selectedServiceIds.length}</strong> service{selectedServiceIds.length > 1 ? 's' : ''} sélectionné{selectedServiceIds.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSaveServices}
                    disabled={savingServices}
                    className="w-full sm:w-auto mt-4"
                  >
                    {savingServices ? 'Enregistrement...' : 'Enregistrer les services'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chargement des services...</p>
              )}
            </div>

            {/* Travaux récents */}
            <div className="pt-4 border-t">
              <h3 className="text-base font-semibold mb-2">Travaux récents</h3>
              <p className="text-xs text-gray-500 mb-3">
                Ajoutez quelques photos de vos réalisations récentes pour rassurer les clients.
              </p>
              {travauxRecents && travauxRecents.length > 0 ? (
                <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {travauxRecents.map((work) => {
                    const imageSrc = normalizeImageUrl(work.imageUrl, work.updatedAt || work.createdAt);
                    return (
                      <div key={work.id} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 group">
                        <img
                          src={imageSrc || 'https://via.placeholder.com/300x300?text=Image+non+disponible'}
                          alt={work.titre || 'Travail récent'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('placeholder')) return; // Éviter la boucle infinie
                            target.src = 'https://via.placeholder.com/300x300?text=Image+non+disponible';
                          }}
                        />
                        {work.titre && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {work.titre}
                          </div>
                        )}
                        {/* Boutons d'action au survol */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors" title="Remplacer l'image">
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
                            className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 transition-colors"
                            title="Supprimer l'image"
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
                <div className="mb-4 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                  <p className="text-sm text-gray-500">Aucun travail récent ajouté</p>
                  <p className="text-xs text-gray-400 mt-1">Ajoutez des photos pour montrer vos réalisations</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="cursor-pointer">
                  <span className={`px-4 py-2 rounded-md transition-opacity inline-block ${
                    workUploading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-primary text-white hover:opacity-90'
                  }`}>
                    {workUploading ? 'Envoi en cours...' : 'Choisir une image'}
                  </span>
                  <input
                    id="workFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleWorkImageUpload(e.target.files[0]);
                        // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
                        e.target.value = '';
                      }
                    }}
                    disabled={workUploading}
                    className="hidden"
                  />
                </label>
                {workUploading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-500">Téléversement en cours...</span>
                  </div>
                )}
              </div>
              {travauxRecents && travauxRecents.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {travauxRecents.length} photo{travauxRecents.length > 1 ? 's' : ''} ajoutée{travauxRecents.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="disponibilite"
                type="checkbox"
                checked={form.disponibilite}
                onChange={(e) => setForm({ ...form, disponibilite: e.target.checked })}
              />
              <label htmlFor="disponibilite" className="text-sm">Disponible</label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées utilisateur */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
            <CardDescription>Adresse et localisation affichées aux clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="Email professionnel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <Input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                placeholder="Numéro de téléphone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <Input value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <Input type="number" value={contact.latitude} onChange={(e) => setContact({ ...contact, latitude: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <Input type="number" value={contact.longitude} onChange={(e) => setContact({ ...contact, longitude: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={handleUseGeolocation}>Utiliser ma position</Button>
              <Button type="button" onClick={handleSaveContact} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer les coordonnées'}</Button>
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


