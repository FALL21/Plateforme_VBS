'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STATUTS_COMMANDE = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ACCEPTEE', label: 'Acceptée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    statut: 'all',
    dateDebut: '',
    dateFin: '',
    secteur: 'all',
    client: '',
  });

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const res = await api.get('/commandes/admin');
        setCommandes(res.data || []);
      } catch (error) {
        console.error('Erreur chargement commandes admin:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommandes();
  }, []);

  // Extraire les secteurs uniques pour le filtre
  const secteursUniques = useMemo(() => {
    const secteurs = new Map();
    commandes.forEach((c) => {
      const secteur = c.demande?.service?.sousSecteur?.secteur;
      if (secteur?.id && secteur?.nom) {
        secteurs.set(secteur.id, secteur.nom);
      }
    });
    return Array.from(secteurs.entries()).map(([id, nom]) => ({ id, nom }));
  }, [commandes]);

  // Filtrer les commandes
  const commandesFiltrees = useMemo(() => {
    return commandes.filter((c) => {
      // Filtre par statut
      if (filters.statut !== 'all' && c.statut !== filters.statut) {
        return false;
      }

      // Filtre par date
      if (filters.dateDebut) {
        const dateDebut = new Date(filters.dateDebut);
        dateDebut.setHours(0, 0, 0, 0);
        const dateCommande = new Date(c.createdAt);
        if (dateCommande < dateDebut) {
          return false;
        }
      }
      if (filters.dateFin) {
        const dateFin = new Date(filters.dateFin);
        dateFin.setHours(23, 59, 59, 999);
        const dateCommande = new Date(c.createdAt);
        if (dateCommande > dateFin) {
          return false;
        }
      }

      // Filtre par secteur
      if (filters.secteur !== 'all') {
        const secteurId = c.demande?.service?.sousSecteur?.secteur?.id;
        if (secteurId !== filters.secteur) {
          return false;
        }
      }

      // Filtre par client (recherche dans phone ou email)
      if (filters.client) {
        const clientSearch = filters.client.toLowerCase();
        const phone = c.utilisateur?.phone?.toLowerCase() || '';
        const email = c.utilisateur?.email?.toLowerCase() || '';
        if (!phone.includes(clientSearch) && !email.includes(clientSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [commandes, filters]);

  const resetFilters = () => {
    setFilters({
      statut: 'all',
      dateDebut: '',
      dateFin: '',
      secteur: 'all',
      client: '',
    });
  };

  const hasActiveFilters = filters.statut !== 'all' || filters.dateDebut || filters.dateFin || filters.secteur !== 'all' || filters.client;

  if (loading) {
    return <div className="text-gray-500 text-sm">Chargement des commandes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Commandes clients</h1>
        <p className="text-sm text-gray-600 mt-1">
          Liste des commandes créées entre clients et prestataires.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les commandes selon vos critères.
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
                  {STATUTS_COMMANDE.map((statut) => (
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
              <label className="text-xs font-medium text-gray-700 mb-1 block">Secteur</label>
              <Select
                value={filters.secteur}
                onValueChange={(value) => setFilters({ ...filters, secteur: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                  {secteursUniques.map((secteur) => (
                    <SelectItem key={secteur.id} value={secteur.id}>
                      {secteur.nom}
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
                {commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? 's' : ''} trouvée{commandesFiltrees.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>
            {hasActiveFilters
              ? `${commandesFiltrees.length} commande${commandesFiltrees.length > 1 ? 's' : ''} correspondant aux filtres.`
              : 'Les 200 dernières commandes, triées par date de création.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commandesFiltrees.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              {hasActiveFilters
                ? 'Aucune commande ne correspond aux filtres sélectionnés.'
                : 'Aucune commande pour le moment.'}
            </p>
          ) : (
            <div className="space-y-3">
              {commandesFiltrees.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span>{c.demande?.service?.nom || 'Service'}</span>
                      {c.statut && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {c.statut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Prestataire: {c.prestataire?.raisonSociale || 'Non renseigné'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Client: {c.utilisateur?.phone || c.utilisateur?.email || 'Inconnu'}
                    </p>
                    {typeof c.prix === 'number' && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Montant: {c.prix.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleString('fr-FR')}
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



