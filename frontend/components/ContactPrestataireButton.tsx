'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastError, toastSuccess } from '@/lib/toast';

interface ContactPrestataireButtonProps {
  prestataire: any;
  size?: 'sm' | 'full';
}

export default function ContactPrestataireButton({ prestataire, size = 'sm' }: ContactPrestataireButtonProps) {
  const router = useRouter();
  const [contacting, setContacting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContact = async () => {
    console.log('🔍 Tentative de contact...');
    console.log('🔐 État auth:', { isAuth: isAuthenticated(), user: user?.phone, role: user?.role });

    // Si non connecté, simplement ouvrir le lien tel:
    if (!isAuthenticated()) {
      console.log('👤 Visiteur non connecté - Appel direct sans créer de commande');
      if (prestataire.user?.phone) {
        // Afficher une modale de confirmation moderne
        setShowConfirmDialog(true);
      } else {
        toastError('Numéro indisponible', 'Le numéro de téléphone de ce prestataire n\'est pas disponible.');
      }
      return;
    }

    if (user?.role !== 'USER') {
      console.log('❌ Rôle incorrect:', user?.role);
      toastError('Action non autorisée', 'Seuls les clients peuvent créer des commandes.');
      return;
    }

    console.log('✅ Auth OK - Création de la commande en cours...');

    setContacting(true);

    try {
      console.log('📦 Prestataire data:', prestataire);
      const firstService = prestataire.prestataireServices?.[0]?.service;
      console.log('🔧 First service:', firstService);
      
      if (!firstService) {
        toastError('Services non configurés', 'Ce prestataire n\'a pas encore configuré ses services.');
        setContacting(false);
        return;
      }

      // Créer une demande
      const requestData = {
        serviceId: firstService.id,
        description: `Contact téléphonique avec ${prestataire.raisonSociale}`,
      };
      console.log('📤 Création demande:', requestData);

      const demandeRes = await api.post('/demandes', requestData);
      console.log('✅ Demande créée:', demandeRes.data);

      // Créer une commande EN_COURS
      const commandeRes = await api.post('/commandes/from-contact', {
        demandeId: demandeRes.data.id,
        prestataireId: prestataire.id,
      });
      console.log('✅ Commande créée:', commandeRes.data);

      // Afficher un message de succès
      toastSuccess('Commande créée', 'Votre commande a été créée avec succès. Vous pouvez maintenant appeler le prestataire.');
      
      // Ouvrir le lien tel: pour appeler le prestataire après un court délai
      setTimeout(() => {
        if (prestataire.user?.phone) {
          window.location.href = `tel:${prestataire.user.phone}`;
        }
      }, 500);
      
      // Rediriger vers le dashboard après 1 seconde
      setTimeout(() => {
        router.push('/client/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Erreur lors du contact:', error);
      toastError('Erreur', error.response?.data?.message || 'Impossible de créer la commande. Veuillez réessayer.');
    } finally {
      setContacting(false);
    }
  };

  const handleConfirmCall = () => {
    if (prestataire.user?.phone) {
      window.location.href = `tel:${prestataire.user.phone}`;
    }
  };

  const buttonClass = size === 'full' ? 'w-full' : 'px-3 py-1.5 text-sm';

  // Ne rien afficher tant que l'hydratation n'est pas terminée
  if (!mounted || !_hasHydrated) {
    return (
      <Button className={buttonClass} disabled>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Appeler
      </Button>
    );
  }

  return (
    <>
      <Button 
        className={`${buttonClass} flex items-center justify-center gap-2`} 
        onClick={handleContact}
        disabled={contacting}
      >
        {contacting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Contact en cours...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Appeler</span>
          </>
        )}
      </Button>
      
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={`Appeler ${prestataire.raisonSociale}`}
        description={
          <>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-base text-gray-800 text-center">
                  Vous allez appeler <strong className="text-gray-900 font-semibold">{prestataire.raisonSociale}</strong>
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Votre application de téléphone (FaceTime, Téléphone, etc.) s'ouvrira automatiquement
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1.5">Pourquoi se connecter ?</p>
                    <ul className="text-sm text-blue-700 leading-relaxed space-y-1.5 list-none">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Suivre l'historique de vos commandes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Laisser des avis sur les prestataires</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Bénéficier d'un meilleur suivi de vos services</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        }
        confirmText="📞 Appeler maintenant"
        cancelText="Annuler"
        onConfirm={handleConfirmCall}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        }
      />
    </>
  );
}
