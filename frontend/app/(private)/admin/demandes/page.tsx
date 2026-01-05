'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const res = await api.get('/demandes/admin');
        setDemandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement demandes admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemandes();
  }, []);

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">Chargement des demandes...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Demandes clients</h1>
        <p className="text-sm text-gray-600 mt-1">
          Vue globale des demandes créées par les clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes récentes</CardTitle>
          <CardDescription>
            Les 200 dernières demandes, triées par date de création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demandes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Aucune demande pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {demandes.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span>{d.service?.nom || 'Service'}</span>
                      {d.statut && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {d.statut}
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {d.description}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">
                      Client: {d.utilisateur?.phone || d.utilisateur?.email || 'Inconnu'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



