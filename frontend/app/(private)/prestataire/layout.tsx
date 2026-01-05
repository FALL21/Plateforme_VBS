'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function PrestataireLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith('/prestataire/create');
  const { isReady } = useProtectedRoute({
    roles: isOnboarding ? undefined : 'PRESTATAIRE',
    skip: !!isOnboarding,
  });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}


