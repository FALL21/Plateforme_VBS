'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Déterminer si c'est un email ou un téléphone
      const isEmail = identifier.includes('@');
      await api.post('/auth/otp/request', {
        phone: isEmail ? undefined : identifier,
        email: isEmail ? identifier : undefined,
      });
      setStep('verify');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', {
        identifier,
        code,
      });
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);
      router.push('/');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Code incorrect';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">
          {step === 'phone' ? 'Connexion' : 'Vérification'}
        </h2>
        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp}>
            <div className="mb-4">
              <label className="block mb-2">Téléphone ou Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block mb-2">Code OTP</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 border rounded"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="mt-2 text-blue-600"
            >
              Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

