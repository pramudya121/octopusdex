import { useState, useCallback, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { toast } from 'sonner';
import { PHAROS_TESTNET } from '@/config/contracts';

export interface PendingTransaction {
  hash: `0x${string}`;
  type: 'swap' | 'approve' | 'addLiquidity' | 'removeLiquidity' | 'wrap' | 'unwrap';
  description: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

const STORAGE_KEY = 'octopus-dex-pending-txs';

export const usePendingTransactions = () => {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const publicClient = usePublicClient();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PendingTransaction[];
        // Filter out old transactions (older than 1 hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recent = parsed.filter(tx => tx.timestamp > oneHourAgo);
        setTransactions(recent);
      }
    } catch (error) {
      console.error('Failed to load pending transactions:', error);
    }
  }, []);

  // Save to localStorage when transactions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Failed to save pending transactions:', error);
    }
  }, [transactions]);

  const addTransaction = useCallback((
    hash: `0x${string}`,
    type: PendingTransaction['type'],
    description: string
  ) => {
    const newTx: PendingTransaction = {
      hash,
      type,
      description,
      timestamp: Date.now(),
      status: 'pending',
    };

    setTransactions(prev => [newTx, ...prev]);

    // Show toast with link
    toast.loading(description, {
      id: hash,
      description: 'Transaction submitted',
      action: {
        label: 'View',
        onClick: () => window.open(`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${hash}`, '_blank'),
      },
    });

    return newTx;
  }, []);

  const updateTransaction = useCallback((
    hash: `0x${string}`,
    status: 'confirmed' | 'failed'
  ) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.hash === hash ? { ...tx, status } : tx
      )
    );

    // Update toast
    if (status === 'confirmed') {
      toast.success('Transaction confirmed!', {
        id: hash,
        action: {
          label: 'View',
          onClick: () => window.open(`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${hash}`, '_blank'),
        },
      });
    } else {
      toast.error('Transaction failed', {
        id: hash,
        action: {
          label: 'View',
          onClick: () => window.open(`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${hash}`, '_blank'),
        },
      });
    }
  }, []);

  const watchTransaction = useCallback(async (hash: `0x${string}`) => {
    if (!publicClient) return;

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        updateTransaction(hash, 'confirmed');
      } else {
        updateTransaction(hash, 'failed');
      }
    } catch (error) {
      console.error('Error watching transaction:', error);
      updateTransaction(hash, 'failed');
    }
  }, [publicClient, updateTransaction]);

  const clearCompleted = useCallback(() => {
    setTransactions(prev => prev.filter(tx => tx.status === 'pending'));
  }, []);

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  return {
    transactions,
    pendingCount,
    addTransaction,
    updateTransaction,
    watchTransaction,
    clearCompleted,
  };
};
