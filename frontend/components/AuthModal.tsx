'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ToastContainer';
import { countries, getDefaultCountry, normalizePhoneByCountry, type Country } from '@/lib/countries';
import { detectUserCountry } from '@/lib/geolocation';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
  onAuthenticated?: (user: any) => void;
}

export default function AuthModal({ open, onOpenChange, redirectTo, onAuthenticated }: AuthModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry());
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();

  // Détecter automatiquement le pays au chargement du modal
  useEffect(() => {
    if (open && step === 'auth') {
      setDetectingCountry(true);
      detectUserCountry()
        .then((country) => {
          setSelectedCountry(country);
          setDetectingCountry(false);
        })
        .catch((error) => {
          console.error('Erreur détection pays:', error);
          setDetectingCountry(false);
        });
    }
  }, [open, step]);

  const normalizePhone = (raw: string, country: Country) => {
    return normalizePhoneByCountry(raw, country);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(identifier, selectedCountry);
      await api.post('/auth/otp/request', {
        phone: normalizedPhone,
        country: selectedCountry.code,
      });
      setStep('verify');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi du code';
      toast.error('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const payloadIdentifier = normalizePhone(identifier, selectedCountry);
      const response = await api.post('/auth/otp/verify', {
        identifier: payloadIdentifier,
        code,
        country: selectedCountry.code,
      });
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);

      // Double-check statut actif après login
      try {
        const meRes = await api.get('/users/me');
        const me = meRes?.data;
        if (me && me.actif === false) {
          toast.error('Compte désactivé', 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
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
      const role = response.data?.user?.role;
      const authenticatedUser = response.data?.user;
      onAuthenticated?.(authenticatedUser);
      
      // Si onAuthenticated est fourni et redirectTo est vide, ne pas rediriger automatiquement
      // L'appelant gère la redirection ou reste sur la même page
      if (onAuthenticated && redirectTo === '') {
        onOpenChange(false);
        setIdentifier('');
        setCode('');
        setStep('auth');
        return;
      }

      const redirectByRole: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        PRESTATAIRE: '/prestataire/dashboard',
        USER: '/client/dashboard',
      };
      const destination = redirectTo || redirectByRole[role || ''] || '/';

      onOpenChange(false);
      setIdentifier('');
      setCode('');
      setStep('auth');

      if (destination && window.location.pathname === destination) {
        router.refresh();
      } else if (destination) {
        router.push(destination);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Code incorrect';
      toast.error('Code incorrect', errorMessage);
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
      toast.info('Bientôt disponible', 'L\'authentification Google sera bientôt disponible. Utilisez email ou téléphone pour l\'instant.');
      setGoogleLoading(false);
      
      // Une fois l'endpoint créé, décommenter cette ligne :
      // window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Erreur Google Auth:', error);
      toast.error('Erreur', 'Erreur lors de la connexion avec Google');
      setGoogleLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form on close
    setStep('auth');
    setIdentifier('');
    setCode('');
    // Redétecter le pays à la prochaine ouverture
    setSelectedCountry(getDefaultCountry());
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
              ? 'Entrez votre numéro de téléphone pour continuer'
              : 'Entrez le code reçu par SMS'}
          </DialogDescription>
        </DialogHeader>

        {step === 'auth' ? (
          <div className="space-y-4">
            {/* Formulaire Téléphone uniquement */}
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  {/* Sélecteur de pays */}
                  <Select
                    value={selectedCountry.code}
                    onValueChange={(value) => {
                      const country = countries.find(c => c.code === value);
                      if (country) setSelectedCountry(country);
                    }}
                    disabled={detectingCountry || loading}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        {detectingCountry ? (
                          <span className="text-xs text-gray-500">Détection...</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span>{selectedCountry.flag}</span>
                            <span className="text-xs">{selectedCountry.dialCode}</span>
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-xs text-gray-500">{country.dialCode}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="identifier"
                    type="tel"
                    placeholder={
                      detectingCountry 
                        ? 'Détection du pays...' 
                        : '771234567'
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading || detectingCountry}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Sélectionnez votre pays et entrez votre numéro de téléphone
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full"
              >
                {loading ? 'Envoi en cours...' : 'Continuer'}
              </Button>
            </form>
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
                Code envoyé par SMS à {normalizePhone(identifier, selectedCountry)}
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

