'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STATUTS_DEMANDE = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ACCEPTEE', label: 'Acceptée' },
  { value: 'REFUSEE', label: 'Refusée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: 'all',
    dateDebut: '',
    dateFin: '',
    service: 'all',
    client: '',
  });

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const res = await api.get('/demandes/admin');
        setDemandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement demandes admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemandes();
  }, []);

  // Extraire les services uniques pour le filtre
  const servicesUniques = useMemo(() => {
    const services = new Map();
    demandes.forEach((d) => {
      if (d.service?.id && d.service?.nom) {
        services.set(d.service.id, d.service.nom);
      }
    });
    return Array.from(services.entries()).map(([id, nom]) => ({ id, nom }));
  }, [demandes]);

  // Filtrer les demandes
  const demandesFiltrees = useMemo(() => {
    return demandes.filter((d) => {
      // Filtre par statut
      if (filters.statut !== 'all' && d.statut !== filters.statut) {
        return false;
      }

      // Filtre par date
      if (filters.dateDebut) {
        const dateDebut = new Date(filters.dateDebut);
        dateDebut.setHours(0, 0, 0, 0);
        const dateDemande = new Date(d.createdAt);
        if (dateDemande < dateDebut) {
          return false;
        }
      }
      if (filters.dateFin) {
        const dateFin = new Date(filters.dateFin);
        dateFin.setHours(23, 59, 59, 999);
        const dateDemande = new Date(d.createdAt);
        if (dateDemande > dateFin) {
          return false;
        }
      }

      // Filtre par service
      if (filters.service !== 'all' && d.service?.id !== filters.service) {
        return false;
      }

      // Filtre par client (recherche dans phone ou email)
      if (filters.client) {
        const clientSearch = filters.client.toLowerCase();
        const phone = d.utilisateur?.phone?.toLowerCase() || '';
        const email = d.utilisateur?.email?.toLowerCase() || '';
        if (!phone.includes(clientSearch) && !email.includes(clientSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [demandes, filters]);

  const resetFilters = () => {
    setFilters({
      statut: 'all',
      dateDebut: '',
      dateFin: '',
      service: 'all',
      client: '',
    });
  };

  const hasActiveFilters = filters.statut !== 'all' || filters.dateDebut || filters.dateFin || filters.service !== 'all' || filters.client;

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">Chargement des demandes...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Demandes clients</h1>
        <p className="text-sm text-gray-600 mt-1">
          Vue globale des demandes créées par les clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les demandes selon vos critères.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Statut</label>
              <Select
                value={filters.statut}
                onValueChange={(value) => setFilters({ ...filters, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS_DEMANDE.map((statut) => (
                    <SelectItem key={statut.value} value={statut.value}>
                      {statut.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Date début</label>
              <Input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Date fin</label>
              <Input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Service</label>
              <Select
                value={filters.service}
                onValueChange={(value) => setFilters({ ...filters, service: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {servicesUniques.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Client (téléphone/email)</label>
              <Input
                type="text"
                placeholder="Rechercher..."
                value={filters.client}
                onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser les filtres
              </Button>
              <span className="text-xs text-gray-500">
                {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? 's' : ''} trouvée{demandesFiltrees.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes récentes</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `${demandesFiltrees.length} demande${demandesFiltrees.length > 1 ? 's' : ''} correspondant aux filtres.`
              : 'Les 200 dernières demandes, triées par date de création.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demandesFiltrees.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              {hasActiveFilters
                ? 'Aucune demande ne correspond aux filtres sélectionnés.'
                : 'Aucune demande pour le moment.'}
            </p>
          ) : (
            <div className="space-y-3">
              {demandesFiltrees.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span>{d.service?.nom || 'Service'}</span>
                      {d.statut && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {d.statut}
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {d.description}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500 mt-1">
                      Client: {d.utilisateur?.phone || d.utilisateur?.email || 'Inconnu'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



