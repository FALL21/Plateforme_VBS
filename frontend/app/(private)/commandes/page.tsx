"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Commande { id: string; reference: string; statut: string; createdAt: string; }

export default function CommandesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState<Commande[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const res = await api.get('/commandes/me');
        setCommandes(res.data || []);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, router]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>
        <div className="space-y-3">
          {commandes.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-lg">Commande {c.reference}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <div>Statut: {c.statut}</div>
                <div>Créée le {new Date(c.createdAt).toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
          ))}
          {commandes.length === 0 && (
            <Card><CardContent className="p-6 text-gray-600">Aucune commande</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}


