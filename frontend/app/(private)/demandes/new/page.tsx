"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackButton from "@/components/BackButton";

export default function NouvelleDemandePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [isAuthenticated, router]);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/demandes', { titre, description });
      router.push('/demandes');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
        {/* Bouton retour */}
        <div>
          <BackButton href="/demandes" label="Retour aux demandes" />
        </div>
        
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Nouvelle demande</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <Input placeholder="Titre" value={titre} onChange={e => setTitre(e.target.value)} />
            <textarea className="w-full border rounded p-2 min-h-[120px]" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto text-xs sm:text-sm">Annuler</Button>
              <Button onClick={submit} disabled={loading || !titre || !description} className="w-full sm:w-auto text-xs sm:text-sm">{loading ? 'Envoi...' : 'Créer'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


