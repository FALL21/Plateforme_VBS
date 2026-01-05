'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skipAuth = useMemo(() => {
    if (!pathname) return false;
    const publicPaths = ['/prestataire/create'];
    return publicPaths.some((allowed) => pathname.startsWith(allowed));
  }, [pathname]);

  const { isReady } = useProtectedRoute({ skip: skipAuth });

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}


