import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'octopus-dex-favorite-tokens';

export const useFavoriteTokens = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setFavorites(parsed);
      }
    } catch (error) {
      console.error('Failed to load favorite tokens:', error);
    }
  }, []);

  // Save to localStorage when favorites change
  const saveFavorites = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorite tokens:', error);
    }
  }, []);

  const addFavorite = useCallback((address: string) => {
    setFavorites(prev => {
      if (prev.includes(address.toLowerCase())) return prev;
      const updated = [...prev, address.toLowerCase()];
      saveFavorites(updated);
      return updated;
    });
  }, [saveFavorites]);

  const removeFavorite = useCallback((address: string) => {
    setFavorites(prev => {
      const updated = prev.filter(a => a !== address.toLowerCase());
      saveFavorites(updated);
      return updated;
    });
  }, [saveFavorites]);

  const toggleFavorite = useCallback((address: string) => {
    const normalizedAddress = address.toLowerCase();
    if (favorites.includes(normalizedAddress)) {
      removeFavorite(normalizedAddress);
    } else {
      addFavorite(normalizedAddress);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((address: string) => {
    return favorites.includes(address.toLowerCase());
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};
