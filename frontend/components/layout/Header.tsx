'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';
import PrestataireOnboardingModal from '@/components/PrestataireOnboardingModal';

export default function Header() {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fermer le menu mobile quand on change de page
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <img src="/signe.png" alt="VBS" className="h-10 sm:h-12 w-10 sm:w-12 object-contain" />
              <span className="text-xl sm:text-2xl font-bold text-primary">VBS</span>
            </Link>
            
            {/* Navigation Desktop */}
            <nav className="hidden lg:flex gap-4 items-center">
              {mounted && _hasHydrated && isAuthenticated() ? (
                <>
                  {/* Dashboard selon le rôle */}
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin/dashboard" className="text-sm sm:text-base text-gray-700 hover:text-primary font-medium">
                      Admin
                    </Link>
                  )}
                  {user?.role === 'PRESTATAIRE' && (
                    <Link href="/prestataire/dashboard" className="text-sm sm:text-base text-gray-700 hover:text-primary font-medium">
                      Tableau de bord
                    </Link>
                  )}
                  {user?.role === 'USER' && (
                    <Link href="/client/dashboard" className="text-sm sm:text-base text-gray-700 hover:text-primary font-medium">
                      Mes services
                    </Link>
                  )}
                  
                  <Link href="/profile" className="text-sm sm:text-base text-gray-700 hover:text-primary">
                    Profil
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="text-sm sm:text-base text-red-600 hover:text-red-800"
                  >
                    Déconnexion
                  </button>
                </>
              ) : mounted && _hasHydrated ? (
                <>
                <button
                  onClick={() => setOnboardingModalOpen(true)}
                  className="text-sm sm:text-base text-gray-700 hover:text-primary font-medium px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Devenir prestataire
                </button>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-primary text-white px-3 sm:px-4 py-2 rounded hover:opacity-90 transition-opacity font-medium text-sm sm:text-base"
                >
                  Connexion ou inscription
                </button>
                </>
              ) : null}
            </nav>

            {/* Bouton Menu Hamburger (Mobile) */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay pour mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Menu Mobile (Drawer) */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col h-full p-4 overflow-y-auto">
          {mounted && _hasHydrated && isAuthenticated() ? (
            <>
              {/* Dashboard selon le rôle */}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              {user?.role === 'PRESTATAIRE' && (
                <Link
                  href="/prestataire/dashboard"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Tableau de bord
                </Link>
              )}
              {user?.role === 'USER' && (
                <Link
                  href="/client/dashboard"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Mes services
                </Link>
              )}
              
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              >
                Profil
              </Link>
              
              <div className="mt-auto pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg font-medium transition-colors text-left"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : mounted && _hasHydrated ? (
            <>
              <Link
                href="/prestataire/create"
                onClick={closeMobileMenu}
                className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Devenir prestataire
              </Link>
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  closeMobileMenu();
                }}
                className="mt-4 px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Connexion ou inscription
              </button>
            </>
          ) : null}
        </nav>
      </div>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        redirectTo=""
      />
      <PrestataireOnboardingModal
        open={onboardingModalOpen}
        onOpenChange={setOnboardingModalOpen}
      />
    </>
  );
}

