'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RatingStars from '@/components/RatingStars';
import MapView from '@/components/MapView';
import ContactPrestataireButton from '@/components/ContactPrestataireButton';

export default function PrestataireDetailPage() {
  const params = useParams();
  const [prestataire, setPrestataire] = useState<any>(null);
  const [avis, setAvis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prestataireRes, avisRes] = await Promise.all([
          api.get(`/prestataires/${params.id}`),
          api.get(`/avis/prestataire/${params.id}`),
        ]);
        setPrestataire(prestataireRes.data);
        setAvis(avisRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Chargement...</div>
      </div>
    );
  }

  if (!prestataire) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Prestataire non trouvé</div>
      </div>
    );
  }

  const mapCenter: [number, number] = prestataire.localisation
    ? [prestataire.localisation.coordinates[1], prestataire.localisation.coordinates[0]]
    : [14.7167, -17.4677];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{prestataire.raisonSociale}</CardTitle>
                <CardDescription className="text-lg">{prestataire.description}</CardDescription>
              </div>
              <img
                src={prestataire.logoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop'}
                alt={prestataire.raisonSociale}
                className="w-24 h-24 rounded-full object-cover border"
                onError={(e) => ((e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop'))}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <RatingStars rating={prestataire.noteMoyenne || 0} showValue size="lg" />
              <span className="text-gray-600">
                {prestataire.nombreAvis || 0} avis
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                prestataire.disponibilite
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {prestataire.disponibilite ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services proposés */}
            {prestataire.prestataireServices && prestataire.prestataireServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services proposés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prestataire.prestataireServices.map((ps: any) => (
                      <div key={ps.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{ps.service.nom}</p>
                          {ps.description && (
                            <p className="text-sm text-gray-600">{ps.description}</p>
                          )}
                        </div>
                        {ps.tarifIndicatif && (
                          <span className="font-semibold text-blue-600">
                            {ps.tarifIndicatif} FCFA
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Avis */}
            <Card>
              <CardHeader>
                <CardTitle>Avis clients ({avis.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {avis.length > 0 ? (
                    avis.map((a: any) => (
                      <div key={a.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <RatingStars rating={a.note} size="sm" />
                          <span className="text-sm text-gray-600">
                            {a.utilisateur?.email || a.utilisateur?.phone || 'Anonyme'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {a.commentaire && (
                          <p className="text-gray-700">{a.commentaire}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucun avis pour le moment</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <MapView
                  center={mapCenter}
                  markers={[{
                    position: mapCenter,
                    title: prestataire.raisonSociale,
                  }]}
                />
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prestataire.user?.phone && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2"><strong>Téléphone:</strong></p>
                    <a
                      href={`tel:${prestataire.user.phone}`}
                      className="text-primary hover:underline"
                    >
                      {prestataire.user.phone}
                    </a>
                  </div>
                )}
                {prestataire.user?.address && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2"><strong>Adresse:</strong></p>
                    <p className="text-sm">{prestataire.user.address}</p>
                  </div>
                )}
                <ContactPrestataireButton prestataire={prestataire} size="full" />
                <p className="text-xs text-gray-500 text-center">
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
