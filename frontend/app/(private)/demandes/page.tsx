"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-gray-500 text-sm sm:text-base">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Bouton retour */}
        <div>
          <BackButton href="/client/dashboard" label="Retour au dashboard" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes demandes</h1>
          <a href="/demandes/new" className="text-primary hover:underline text-sm sm:text-base font-medium text-center sm:text-left">
            Créer une demande
          </a>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {demandes.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-gray-600 text-center text-sm sm:text-base">
                Aucune demande
              </CardContent>
            </Card>
          ) : (
            demandes.map((demande: any) => (
              <Card key={demande.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <CardTitle className="text-base sm:text-lg text-gray-900 break-words flex-1 min-w-0">
                      {demande.service?.nom || 'Service'}
                    </CardTitle>
                    <div className="flex-shrink-0">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        demande.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        demande.statut === 'ACCEPTEE' ? 'bg-green-100 text-green-800' :
                        demande.statut === 'REFUSEE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {demande.statut}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-xs sm:text-sm text-gray-600">
                  {demande.description && (
                    <div className="mb-2 break-words">{demande.description}</div>
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


