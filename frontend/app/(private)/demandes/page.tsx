"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemandesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const res = await api.get('/demandes/mes-demandes');
        setDemandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [isAuthenticated, router]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes demandes</h1>
          <a href="/demandes/new" className="text-primary hover:underline">Créer une demande</a>
        </div>
        <div className="space-y-3">
          {demandes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-gray-600 text-center">
                Aucune demande
              </CardContent>
            </Card>
          ) : (
            demandes.map((demande: any) => (
              <Card key={demande.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {demande.service?.nom || 'Service'}
                    </CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      demande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                      demande.statut === 'ACCEPTEE' ? 'bg-green-100 text-green-800' :
                      demande.statut === 'REFUSEE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {demande.statut}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {demande.description && (
                    <div className="mb-2">{demande.description}</div>
                  )}
                  <div>Créée le {new Date(demande.createdAt).toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


