'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
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
  });

  // Données pour les sélections
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [sousSecteurs, setSousSecteurs] = useState<SousSecteur[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Charger les secteurs
    const fetchSecteurs = async () => {
      try {
        const response = await api.get('/secteurs');
        setSecteurs(response.data || []);
      } catch (error) {
        console.error('Erreur chargement secteurs:', error);
      }
    };
    fetchSecteurs();
  }, [isAuthenticated, router]);

  // Charger les sous-secteurs et services quand un secteur est sélectionné
  useEffect(() => {
    if (formData.secteurs.length > 0) {
      const fetchData = async () => {
        try {
          const allSousSecteurs: SousSecteur[] = [];
          for (const secteurId of formData.secteurs) {
            const response = await api.get(`/secteurs/${secteurId}/sous-secteurs`);
            allSousSecteurs.push(...(response.data || []));
          }
          setSousSecteurs(allSousSecteurs);

          // Charger les services pour tous les sous-secteurs
          const allServices: Service[] = [];
          for (const ss of allSousSecteurs) {
            const servicesRes = await api.get('/services', {
              params: { sousSecteurId: ss.id },
            });
            allServices.push(...(servicesRes.data || []));
          }
          setServices(allServices);
        } catch (error) {
          console.error('Erreur chargement données:', error);
        }
      };
      fetchData();
    } else {
      setSousSecteurs([]);
      setServices([]);
    }
  }, [formData.secteurs]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/prestataires', {
        ...formData,
        localisation: {
          type: 'Point',
          coordinates: [formData.longitude, formData.latitude],
        },
      });
      router.push('/prestataire');
    } catch (error: any) {
      console.error('Erreur création prestataire:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création');
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

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Précédent
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Localisation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Cliquez sur la carte pour définir votre localisation
                </p>
                <MapView
                  center={[formData.latitude, formData.longitude]}
                  zoom={13}
                  onLocationSelect={handleLocationSelect}
                  className="rounded-lg"
                />
                <div className="text-sm text-gray-600">
                  <p>Latitude: {formData.latitude.toFixed(6)}</p>
                  <p>Longitude: {formData.longitude.toFixed(6)}</p>
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
      </div>
    </div>
  );
}

