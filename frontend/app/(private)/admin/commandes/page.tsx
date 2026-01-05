'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const res = await api.get('/commandes/admin');
        setCommandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement commandes admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommandes();
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm">Chargement des commandes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Commandes clients</h1>
        <p className="text-sm text-gray-600 mt-1">
          Liste des commandes créées entre clients et prestataires.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>
            Les 200 dernières commandes, triées par date de création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commandes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Aucune commande pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {commandes.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span>{c.demande?.service?.nom || 'Service'}</span>
                      {c.statut && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {c.statut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Prestataire: {c.prestataire?.raisonSociale || 'Non renseigné'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Client: {c.utilisateur?.phone || c.utilisateur?.email || 'Inconnu'}
                    </p>
                    {typeof c.prix === 'number' && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Montant: {c.prix.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleString('fr-FR')}
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



