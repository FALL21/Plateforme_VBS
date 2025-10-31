'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setProfile(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-xl font-bold mb-4">Informations personnelles</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {profile?.email || 'Non renseigné'}</p>
            <p><strong>Téléphone:</strong> {profile?.phone || 'Non renseigné'}</p>
            <p><strong>Adresse:</strong> {profile?.address || 'Non renseignée'}</p>
            <p><strong>Rôle:</strong> {profile?.role || user?.role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

