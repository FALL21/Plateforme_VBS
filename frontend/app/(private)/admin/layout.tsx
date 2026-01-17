'use client';

import { ReactNode, useState } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isReady } = useProtectedRoute({ roles: 'ADMIN' });
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement...
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Vue d’ensemble',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
        </svg>
      ),
    },
    {
      title: 'Gérer les secteurs',
      href: '/admin/secteurs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h7M4 18h4" />
        </svg>
      ),
    },
    {
      title: 'Valider les prestataires',
      href: '/admin/validations/prestataires',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      title: 'Valider les paiements',
      href: '/admin/validations/paiements',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 11h18M7 15h2m4 0h2m4-8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7z" />
        </svg>
      ),
    },
    {
      title: 'Utilisateurs',
      href: '/admin/users',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-4-4h-1M9 20H4v-1a4 4 0 014-4h1m4-4a3 3 0 100-6 3 3 0 000 6zm-6 0a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Demandes',
      href: '/admin/demandes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-8 5h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Commandes',
      href: '/admin/commandes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l1.5-6H5.4M7 13L5.4 5M7 13l-2 6h14M9 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
    },
    {
      title: 'Rapports & Analytics',
      href: '/admin/reports',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16M7 10v6m5-10v10m5-6v6" />
        </svg>
      ),
    },
    {
      title: 'Modération',
      href: '/admin/moderation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5a8 8 0 01-7 7 8 8 0 01-7-7V7l7-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 xl:py-8">
        {/* Bouton menu burger (mobile/tablette) */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full sm:w-auto border-2 border-gray-200 hover:border-primary/30 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Navigation admin
          </Button>
        </div>

        {/* Overlay mobile (fond sombre quand menu ouvert) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Menu burger mobile (drawer) */}
        <aside
          className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Navigation admin</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Accès rapide aux principales sections</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2">
              {quickActions.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-semibold border-2 border-primary/20'
                        : 'text-gray-700 hover:text-primary hover:bg-primary/5 border-2 border-transparent'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${
                      active ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.icon}
                    </span>
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="lg:grid lg:grid-cols-[260px,1fr] lg:gap-6">
          {/* Sidebar admin (desktop) */}
          <aside className="hidden lg:block">
            <Card className="border-2 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Navigation admin</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Accès rapide aux principales sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {quickActions.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 text-gray-600">
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Contenu des pages admin */}
          <main className="lg:col-span-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

