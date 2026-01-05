'use client';

import { ReactNode } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { isReady } = useProtectedRoute({ roles: 'USER' });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}



