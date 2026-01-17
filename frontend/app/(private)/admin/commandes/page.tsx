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
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-gray-500 text-sm sm:text-base">Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Commandes clients</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Liste des commandes créées entre clients et prestataires.
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Filtrez les commandes selon vos critères.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Statut</label>
              <Select
                value={filters.statut}
                onValueChange={(value) => setFilters({ ...filters, statut: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Date début</label>
              <Input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Date fin</label>
              <Input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Secteur</label>
              <Select
                value={filters.secteur}
                onValueChange={(value) => setFilters({ ...filters, secteur: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Client (téléphone/email)</label>
              <Input
                type="text"
                placeholder="Rechercher..."
                value={filters.client}
                onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs h-9 sm:h-10"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                Réinitialiser les filtres
              </Button>
              <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left py-2 sm:py-0">
                {commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? 's' : ''} trouvée{commandesFiltrees.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Commandes récentes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {hasActiveFilters
              ? `${commandesFiltrees.length} commande${commandesFiltrees.length > 1 ? 's' : ''} correspondant aux filtres.`
              : 'Les 200 dernières commandes, triées par date de création.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commandesFiltrees.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-8 sm:py-12">
              {hasActiveFilters
                ? 'Aucune commande ne correspond aux filtres sélectionnés.'
                : 'Aucune commande pour le moment.'}
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {commandesFiltrees.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg hover:bg-gray-50 hover:border-primary/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-gray-900">
                      <span className="break-words">{c.demande?.service?.nom || 'Service'}</span>
                      {c.statut && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                          {c.statut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 break-words">
                      Prestataire: {c.prestataire?.raisonSociale || 'Non renseigné'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 break-words">
                      Client: {c.utilisateur?.phone || c.utilisateur?.email || 'Inconnu'}
                    </p>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap text-left sm:text-right">
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



