import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'octopus-dex-recent-tokens';
const MAX_RECENT = 5;

export const useRecentTokens = () => {
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentAddresses(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch (error) {
      console.error('Failed to load recent tokens:', error);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentAddresses));
    } catch (error) {
      console.error('Failed to save recent tokens:', error);
    }
  }, [recentAddresses]);

  const addRecent = useCallback((address: string) => {
    setRecentAddresses(prev => {
      const lowerAddr = address.toLowerCase();
      // Remove if already exists, add to front
      const filtered = prev.filter(a => a.toLowerCase() !== lowerAddr);
      return [lowerAddr, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const isRecent = useCallback((address: string) => {
    return recentAddresses.some(a => a.toLowerCase() === address.toLowerCase());
  }, [recentAddresses]);

  const clearRecent = useCallback(() => {
    setRecentAddresses([]);
  }, []);

  return {
    recentAddresses,
    addRecent,
    isRecent,
    clearRecent,
  };
};
