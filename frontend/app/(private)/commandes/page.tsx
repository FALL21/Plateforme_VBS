"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toastSuccess, toastError } from "@/lib/toast";

export default function CommandesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [commandeToCancel, setCommandeToCancel] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'USER') { 
      router.push('/login'); 
      return; 
    }
    const fetchData = async () => {
      try {
        const res = await api.get('/commandes/me');
        setCommandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement commandes:', error);
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [isAuthenticated, user, router]);

  const handleAnnulerCommande = async () => {
    if (!commandeToCancel) return;
    
    try {
      await api.patch(`/commandes/${commandeToCancel.id}/annuler`);
      toastSuccess('Commande annulée', 'Votre commande a été annulée avec succès.');
      setCommandeToCancel(null);
      
      // Recharger les commandes
      const res = await api.get('/commandes/me');
      setCommandes(res.data || []);
    } catch (error: any) {
      console.error('Erreur annulation commande:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible d\'annuler la commande. Veuillez réessayer.');
      setCommandeToCancel(null);
    }
  };

  const handleTerminerCommande = async (commandeId: string) => {
    try {
      await api.patch(`/commandes/${commandeId}/terminer`);
      toastSuccess('Commande terminée', 'Votre commande a été marquée comme terminée.');
      
      // Recharger les commandes
      const res = await api.get('/commandes/me');
      setCommandes(res.data || []);
    } catch (error: any) {
      console.error('Erreur terminer commande:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible de terminer la commande. Veuillez réessayer.');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTEE':
        return 'bg-blue-100 text-blue-800';
      case 'EN_COURS':
        return 'bg-green-100 text-green-800';
      case 'TERMINEE':
        return 'bg-gray-100 text-gray-800';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mes commandes</h1>
        <div className="space-y-4">
          {commandes.map(c => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {c.prestataire?.raisonSociale || 'Prestataire'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {c.demande?.service?.nom || 'Service'}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(c.statut)}`}>
                    {c.statut}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <div>Créée le {new Date(c.createdAt).toLocaleString('fr-FR')}</div>
                </div>
                {['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS'].includes(c.statut) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommandeToCancel(c)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ✕ Annuler
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleTerminerCommande(c.id)}
                    >
                      ✓ Terminer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {commandes.length === 0 && (
            <Card>
              <CardContent className="p-6 text-gray-600 text-center">
                Aucune commande pour le moment.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de confirmation d'annulation */}
        {commandeToCancel && (
          <ConfirmDialog
            open={!!commandeToCancel}
            onOpenChange={(open) => !open && setCommandeToCancel(null)}
            title="Annuler la commande"
            description={
              <>
                <div className="space-y-3">
                  <p className="text-base text-gray-700">
                    Êtes-vous sûr de vouloir annuler la commande avec <strong className="text-gray-900">{commandeToCancel.prestataire?.raisonSociale || 'ce prestataire'}</strong> ?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      Cette action est irréversible. La commande et la demande associée seront annulées.
                    </p>
                  </div>
                </div>
              </>
            }
            confirmText="Confirmer l'annulation"
            cancelText="Retour"
            variant="destructive"
            onConfirm={handleAnnulerCommande}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}


