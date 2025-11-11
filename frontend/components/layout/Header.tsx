'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';

export default function Header() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/signe.png" alt="VBS" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold text-primary">VBS</span>
          </Link>
          
          <nav className="flex gap-4 items-center">
            {mounted && _hasHydrated && isAuthenticated() ? (
              <>
                {/* Dashboard selon le rôle */}
                {user?.role === 'ADMIN' && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary font-medium">
                    Admin
                  </Link>
                )}
                {user?.role === 'PRESTATAIRE' && (
                  <Link href="/prestataire/dashboard" className="text-gray-700 hover:text-primary font-medium">
                    Tableau de bord
                  </Link>
                )}
                {user?.role === 'USER' && (
                  <Link href="/client/dashboard" className="text-gray-700 hover:text-primary font-medium">
                    Mes services
                  </Link>
                )}
                
                <Link href="/profile" className="text-gray-700 hover:text-primary">
                  Profil
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800"
                >
                  Déconnexion
                </button>
              </>
            ) : mounted && _hasHydrated ? (
              <>
                <Link 
                  href="/prestataire/create" 
                  className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Devenir prestataire
                </Link>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-primary text-white px-4 py-2 rounded hover:opacity-90 transition-opacity font-medium"
                >
                  Connexion ou inscription
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </div>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}

