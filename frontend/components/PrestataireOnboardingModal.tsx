'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';

interface PrestataireOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrestataireOnboardingModal({
  open,
  onOpenChange,
}: PrestataireOnboardingModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAuth = isAuthenticated();

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    // Ne pas rediriger, rester sur la même page
    // Le modal "Devenir prestataire" reste ouvert
  };

  const handleClose = () => {
    onOpenChange(false);
    setAuthModalOpen(false);
  };

  const handleStartOnboarding = () => {
    // Fermer le modal et rediriger vers la page d'onboarding complète
    onOpenChange(false);
    router.push('/prestataire/create');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devenir prestataire</DialogTitle>
            <DialogDescription>
              {isAuth
                ? 'Créez votre profil prestataire en quelques étapes simples'
                : 'Connectez-vous ou créez un compte pour poursuivre la création de votre profil prestataire.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!isAuth ? (
              <>
                <Button className="w-full" onClick={() => setAuthModalOpen(true)}>
                  Connexion ou inscription
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Vous pourrez compléter votre profil en quelques étapes après connexion.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Vous êtes connecté. Cliquez sur le bouton ci-dessous pour commencer la création de votre profil prestataire.
                </p>
                <Button className="w-full" onClick={handleStartOnboarding}>
                  Commencer la création du profil
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthenticated={handleAuthSuccess}
        redirectTo=""
      />
    </>
  );
}

