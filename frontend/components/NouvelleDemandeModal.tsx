'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toastSuccess, toastError } from '@/lib/toast';

interface NouvelleDemandeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NouvelleDemandeModal({
  open,
  onOpenChange,
  onSuccess,
}: NouvelleDemandeModalProps) {
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Charger les services disponibles
  useEffect(() => {
    if (open) {
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const response = await api.get('/services');
          setServices(response.data || []);
        } catch (error) {
          console.error('Erreur chargement services:', error);
          toastError('Erreur', 'Impossible de charger les services');
        } finally {
          setLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceId || !description.trim()) {
      toastError('Erreur', 'Veuillez sélectionner un service et remplir la description');
      return;
    }

    setLoading(true);

    try {
      await api.post('/demandes', {
        serviceId,
        description: description.trim(),
      });
      
      toastSuccess('Demande créée', 'Votre demande a été créée avec succès');
      setServiceId('');
      setDescription('');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Erreur lors de la création de la demande:', err);
      toastError('Erreur', err.response?.data?.message || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setServiceId('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            ➕ Nouvelle demande
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1.5">
              Service *
            </label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={loading || loadingServices}>
              <SelectTrigger id="service" className="w-full">
                <SelectValue placeholder={loadingServices ? 'Chargement des services...' : 'Sélectionnez un service'} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              id="description"
              placeholder="Décrivez votre demande de service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={5}
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !serviceId || !description.trim()}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

