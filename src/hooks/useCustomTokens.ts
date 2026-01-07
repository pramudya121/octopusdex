import { useState, useEffect, useCallback } from 'react';
import { Token } from '@/config/contracts';

const STORAGE_KEY = 'octopus-dex-custom-tokens';

export interface CustomToken {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
}

// Generate a logo for custom tokens (first letter as placeholder)
const generateCustomLogo = (symbol: string): string => {
  return '/tokens/octo.png'; // Use default logo for custom tokens
};

export const useCustomTokens = () => {
  const [customTokens, setCustomTokens] = useState<Token[]>([]);

  // Load tokens from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomToken[];
        // Convert to Token format
        const tokens: Token[] = parsed.map(t => ({
          address: t.address,
          name: t.name,
          symbol: t.symbol,
          decimals: t.decimals,
          logoURI: generateCustomLogo(t.symbol),
          isNative: false,
        }));
        setCustomTokens(tokens);
      }
    } catch (error) {
      console.error('Failed to load custom tokens:', error);
    }
  }, []);

  const addToken = useCallback((token: CustomToken) => {
    const newToken: Token = {
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      logoURI: generateCustomLogo(token.symbol),
      isNative: false,
    };

    setCustomTokens(prev => {
      const updated = [...prev, newToken];
      // Save to localStorage
      try {
        const toStore: CustomToken[] = updated.map(t => ({
          address: t.address,
          name: t.name,
          symbol: t.symbol,
          decimals: t.decimals,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to save custom tokens:', error);
      }
      return updated;
    });

    return newToken;
  }, []);

  const removeToken = useCallback((address: string) => {
    setCustomTokens(prev => {
      const updated = prev.filter(t => t.address.toLowerCase() !== address.toLowerCase());
      // Save to localStorage
      try {
        const toStore: CustomToken[] = updated.map(t => ({
          address: t.address,
          name: t.name,
          symbol: t.symbol,
          decimals: t.decimals,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to save custom tokens:', error);
      }
      return updated;
    });
  }, []);

  const isCustomToken = useCallback((address: string) => {
    return customTokens.some(t => t.address.toLowerCase() === address.toLowerCase());
  }, [customTokens]);

  return {
    customTokens,
    addToken,
    removeToken,
    isCustomToken,
  };
};
