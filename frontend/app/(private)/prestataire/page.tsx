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
    return <div className="min-h-screen p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord Prestataire</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Profil</h2>
            {prestataire ? (
              <>
                <p><strong>Raison sociale:</strong> {prestataire.raisonSociale}</p>
                <p><strong>Statut KYC:</strong> {prestataire.kycStatut}</p>
                <p><strong>Disponibilité:</strong> {prestataire.disponibilite ? 'Oui' : 'Non'}</p>
              </>
            ) : (
              <Link href="/prestataire/create" className="text-blue-600">
                Créer un profil prestataire
              </Link>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Abonnement</h2>
            {abonnement ? (
              <>
                <p><strong>Type:</strong> {abonnement.type}</p>
                <p><strong>Statut:</strong> {abonnement.statut}</p>
                <p><strong>Date fin:</strong> {new Date(abonnement.dateFin).toLocaleDateString()}</p>
              </>
            ) : (
              <Link href="/abonnements/souscrire" className="text-blue-600">
                Souscrire un abonnement
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
