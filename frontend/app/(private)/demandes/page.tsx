"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Demande { id: string; titre: string; statut: string; createdAt: string; }

export default function DemandesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState<Demande[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const res = await api.get('/demandes/me');
        setDemandes(res.data || []);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, router]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes demandes</h1>
          <a href="/demandes/new" className="text-primary">Créer une demande</a>
        </div>
        <div className="space-y-3">
          {demandes.map(d => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle className="text-lg">{d.titre}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <div>Statut: {d.statut}</div>
                <div>Créée le {new Date(d.createdAt).toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
          ))}
          {demandes.length === 0 && (
            <Card><CardContent className="p-6 text-gray-600">Aucune demande</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}


