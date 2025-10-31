'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

interface ContactPrestataireButtonProps {
  prestataire: any;
  size?: 'sm' | 'full';
}

export default function ContactPrestataireButton({ prestataire, size = 'sm' }: ContactPrestataireButtonProps) {
  const router = useRouter();
  const [contacting, setContacting] = useState(false);
  const [mounted, setMounted] = useState(false);
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
        // Afficher un message informatif
        const doCall = confirm(
          `Vous allez appeler ${prestataire.raisonSociale}.\n\n` +
          `💡 Conseil : Connectez-vous pour suivre vos commandes et laisser des avis !`
        );
        
        if (doCall) {
          window.location.href = `tel:${prestataire.user.phone}`;
        }
      } else {
        alert('Numéro de téléphone non disponible');
      }
      return;
    }

    if (user?.role !== 'USER') {
      console.log('❌ Rôle incorrect:', user?.role);
      alert('Seuls les clients peuvent créer des commandes');
      return;
    }

    console.log('✅ Auth OK - Création de la commande en cours...');

    setContacting(true);

    try {
      console.log('📦 Prestataire data:', prestataire);
      const firstService = prestataire.prestataireServices?.[0]?.service;
      console.log('🔧 First service:', firstService);
      
      if (!firstService) {
        alert('Ce prestataire n\'a pas encore configuré ses services');
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

      // Ouvrir le lien tel: pour appeler le prestataire
      if (prestataire.user?.phone) {
        window.location.href = `tel:${prestataire.user.phone}`;
      }

      // Afficher un message de succès
      alert('Commande créée ! Vous pouvez maintenant appeler le prestataire.');
      
      // Rediriger vers le dashboard après 1 seconde
      setTimeout(() => {
        router.push('/client/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Erreur lors du contact:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création de la commande');
    } finally {
      setContacting(false);
    }
  };

  const buttonClass = size === 'full' ? 'w-full' : 'px-3 py-1.5 text-sm';

  // Ne rien afficher tant que l'hydratation n'est pas terminée
  if (!mounted || !_hasHydrated) {
    return (
      <Button className={buttonClass} disabled>
        📞 Contacter
      </Button>
    );
  }

  return (
    <Button 
      className={buttonClass} 
      onClick={handleContact}
      disabled={contacting}
    >
      {contacting ? 'Contact en cours...' : '📞 Contacter'}
    </Button>
  );
}
