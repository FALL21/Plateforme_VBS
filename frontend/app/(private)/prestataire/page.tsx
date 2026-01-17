'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

export default function PrestataireDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [prestataire, setPrestataire] = useState<any>(null);
  const [abonnement, setAbonnement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== 'PRESTATAIRE') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [prestataireRes, abonnementRes] = await Promise.all([
          api.get('/prestataires/me'),
          api.get('/abonnements/me'),
        ]);
        setPrestataire(prestataireRes.data);
        setAbonnement(abonnementRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-gray-500 text-sm sm:text-base">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Tableau de bord Prestataire</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Profil</h2>
            {prestataire ? (
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <p><strong className="text-gray-700">Raison sociale:</strong> <span className="text-gray-900 break-words">{prestataire.raisonSociale}</span></p>
                <p><strong className="text-gray-700">Statut KYC:</strong> <span className="text-gray-900">{prestataire.kycStatut}</span></p>
                <p><strong className="text-gray-700">Disponibilité:</strong> <span className="text-gray-900">{prestataire.disponibilite ? 'Oui' : 'Non'}</span></p>
              </div>
            ) : (
              <Link href="/prestataire/create" className="inline-block text-primary hover:underline text-sm sm:text-base font-medium">
                Créer un profil prestataire
              </Link>
            )}
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Abonnement</h2>
            {abonnement ? (
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <p><strong className="text-gray-700">Type:</strong> <span className="text-gray-900">{abonnement.type}</span></p>
                <p><strong className="text-gray-700">Statut:</strong> <span className="text-gray-900">{abonnement.statut}</span></p>
                <p><strong className="text-gray-700">Date fin:</strong> <span className="text-gray-900">{new Date(abonnement.dateFin).toLocaleDateString()}</span></p>
              </div>
            ) : (
              <Link href="/abonnements/souscrire" className="inline-block text-primary hover:underline text-sm sm:text-base font-medium">
                Souscrire un abonnement
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
