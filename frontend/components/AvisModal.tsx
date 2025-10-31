'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface AvisModalProps {
  commande: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AvisModal({ commande, onClose, onSuccess }: AvisModalProps) {
  const [note, setNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (note === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/avis', {
        commandeId: commande.id,
        note,
        commentaire: commentaire.trim() || undefined,
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'avis:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Donner votre avis</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Prestataire: <span className="font-medium">{commande.prestataire?.raisonSociale}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Étoiles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNote(star)}
                  onMouseEnter={() => setHoverNote(star)}
                  onMouseLeave={() => setHoverNote(0)}
                  className="text-4xl focus:outline-none transition-transform hover:scale-110"
                >
                  <span className={
                    star <= (hoverNote || note)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {note > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                {note === 1 && 'Très insatisfait'}
                {note === 2 && 'Insatisfait'}
                {note === 3 && 'Moyen'}
                {note === 4 && 'Satisfait'}
                {note === 5 && 'Très satisfait'}
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Partagez votre expérience..."
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Envoi...' : 'Publier l\'avis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

