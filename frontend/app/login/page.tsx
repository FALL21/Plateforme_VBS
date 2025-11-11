'use client';

import { useEffect } from 'react';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Si on arrive directement sur /login, on revient à l'accueil après ouverture du modal
    router.prefetch('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Connexion ou inscription</h1>
        <p className="text-sm text-gray-600">
          Utilisez votre email ou numéro de téléphone pour continuer sur VBS.
        </p>
      </div>
      <AuthModal open onOpenChange={(open) => {
        if (!open) {
          router.push('/');
        }
      }} />
    </div>
  );
}
