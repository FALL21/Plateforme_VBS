'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface UseProtectedRouteOptions {
  roles?: string | string[];
  redirectTo?: string;
  skip?: boolean;
}

export const useProtectedRoute = (options: UseProtectedRouteOptions = {}) => {
  const router = useRouter();
  const { redirectTo = '/login', roles, skip = false } = options;
  const rolesArray = useMemo(() => {
    if (!roles) return [] as string[];
    return Array.isArray(roles) ? roles : [roles];
  }, [roles]);

  const { user, _hasHydrated, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    _hasHydrated: state._hasHydrated,
    isAuthenticated: state.isAuthenticated,
  }));

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (skip) {
      setIsReady(true);
      return;
    }

    const authenticated = isAuthenticated();
    if (!authenticated) {
      setIsReady(false);
      router.replace(redirectTo);
      return;
    }

    if (rolesArray.length && (!user || !rolesArray.includes(user.role))) {
      setIsReady(false);
      router.replace(redirectTo);
      return;
    }

    setIsReady(true);
  }, [_hasHydrated, isAuthenticated, user, router, redirectTo, rolesArray, skip]);

  return { isReady, user };
};


