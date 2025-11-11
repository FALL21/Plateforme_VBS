'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [contact, setContact] = useState({
    email: '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });

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
      } catch (e: any) {
        if (e?.response?.status === 404) {
          alert('Aucun profil prestataire trouvé. Créez votre profil.');
          router.push('/prestataire/create');
        } else {
          alert('Erreur lors du chargement du profil');
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
      alert('Profil mis à jour');
      router.refresh();
      router.push('/prestataire/dashboard');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur lors de la mise à jour');
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
      alert('Coordonnées mises à jour');
      router.refresh();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erreur lors de la mise à jour des coordonnées');
    } finally {
      setSaving(false);
    }
  };

  const handleUseGeolocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Géolocalisation non disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setContact((c) => ({ ...c, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      },
      () => alert('Impossible de récupérer la position'),
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
      alert(e?.response?.data?.message || 'Erreur upload logo');
    } finally {
      setUploading(false);
    }
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
      </div>
    </div>
  );
}


