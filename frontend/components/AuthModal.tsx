'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const normalizePhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0') && !digits.startsWith('221')) {
      digits = `221${digits.slice(1)}`;
    }
    if (!digits.startsWith('221') && raw.startsWith('+')) {
      // already international like +33..., keep
      return digits;
    }
    return digits;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const normalizedPhone = isEmail ? undefined : normalizePhone(identifier);
      await api.post('/auth/otp/request', {
        phone: normalizedPhone,
        email: isEmail ? identifier : undefined,
      });
      setStep('verify');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi du code';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const payloadIdentifier = isEmail ? identifier : normalizePhone(identifier);
      const response = await api.post('/auth/otp/verify', {
        identifier: payloadIdentifier,
        code,
      });
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Double-check statut actif après login
      try {
        const meRes = await api.get('/users/me');
        const me = meRes?.data;
        if (me && me.actif === false) {
          alert('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
          // Forcer logout si store propose une méthode
          window.localStorage.removeItem('auth');
          onOpenChange(false);
          setIdentifier('');
          setCode('');
          setStep('auth');
          return;
        }
      } catch (_) {
        // ignore – si endpoint non dispo, on laisse passer
      }
      onOpenChange(false);
      // Reset form
      setIdentifier('');
      setCode('');
      setStep('auth');
      router.refresh();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Code incorrect';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      // TODO: Implémenter l'authentification Google OAuth côté backend
      // Endpoint à créer : GET /auth/google (initie OAuth) et GET /auth/google/callback
      const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/google`;
      
      // Redirection vers l'endpoint OAuth (à implémenter)
      // Pour l'instant, on affiche un message informatif
      alert('L\'authentification Google sera bientôt disponible. Utilisez email ou téléphone pour l\'instant.');
      setGoogleLoading(false);
      
      // Une fois l'endpoint créé, décommenter cette ligne :
      // window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Erreur Google Auth:', error);
      alert('Erreur lors de la connexion avec Google');
      setGoogleLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form on close
    setStep('auth');
    setIdentifier('');
    setCode('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'auth' ? 'Connexion ou Inscription' : 'Vérification'}
          </DialogTitle>
          <DialogDescription>
            {step === 'auth'
              ? 'Entrez votre email ou numéro de téléphone pour continuer'
              : 'Entrez le code reçu par email ou SMS'}
          </DialogDescription>
        </DialogHeader>

        {step === 'auth' ? (
          <div className="space-y-4">
            {/* Formulaire Email/Téléphone */}
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Email ou Téléphone
                </label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="exemple@email.com ou +221771234567"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full"
              >
                {loading ? 'Envoi en cours...' : 'Continuer'}
              </Button>
            </form>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continuer avec
                </span>
              </div>
            </div>

            {/* Bouton Google */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              className="w-full"
            >
              {googleLoading ? (
                'Connexion...'
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuer avec Google
                </div>
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Code de vérification
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Entrez le code à 6 chiffres"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
                className="w-full text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Code envoyé à {identifier}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('auth');
                  setCode('');
                }}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1"
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

