import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { CONTRACTS, PHAROS_TESTNET, getTokenByAddress } from '@/config/contracts';

export interface Transaction {
  hash: string;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'wrap' | 'unwrap';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  status: 'success';
  timestamp: Date;
  blockNumber: bigint;
  pairAddress?: string;
}

// Event signatures
const DEPOSIT_EVENT = parseAbiItem('event Deposit(address indexed dst, uint256 wad)');
const WITHDRAWAL_EVENT = parseAbiItem('event Withdrawal(address indexed src, uint256 wad)');
const SWAP_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
const MINT_EVENT = parseAbiItem('event Mint(address indexed sender, uint256 amount0, uint256 amount1)');
const BURN_EVENT = parseAbiItem('event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)');

// Create a standalone client for direct contract calls
const createClient = () => createPublicClient({
  chain: {
    id: PHAROS_TESTNET.id,
    name: PHAROS_TESTNET.name,
    nativeCurrency: PHAROS_TESTNET.nativeCurrency,
    rpcUrls: {
      default: { http: [PHAROS_TESTNET.rpcUrls.default.http[0]] },
    },
  },
  transport: http(PHAROS_TESTNET.rpcUrls.default.http[0]),
});

export const useTransactionHistory = () => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pairData, setPairData] = useState<{ address: `0x${string}`; token0: string; token1: string }[]>([]);

  const getTokenSymbol = useCallback((tokenAddress: string): string => {
    const token = getTokenByAddress(tokenAddress);
    if (token) {
      return token.symbol === 'WPHRS' ? 'PHRS' : token.symbol;
    }
    return tokenAddress.slice(0, 6) + '...';
  }, []);

  const getTokenDecimals = useCallback((tokenAddress: string): number => {
    const token = getTokenByAddress(tokenAddress);
    return token?.decimals || 18;
  }, []);

  // Fetch all pairs from factory using multicall
  const fetchPairs = useCallback(async () => {
    const client = createClient();
    
    try {
      // Use call instead of readContract for better compatibility
      const lengthResult = await client.call({
        to: CONTRACTS.FACTORY,
        data: '0x574f2ba3', // allPairsLength() selector
      });
      
      if (!lengthResult.data) return;
      
      const pairsLength = BigInt(lengthResult.data);
      const pairs: { address: `0x${string}`; token0: string; token1: string }[] = [];

      for (let i = 0; i < Number(pairsLength) && i < 20; i++) { // Limit to 20 pairs for performance
        try {
          // Get pair address: allPairs(uint256)
          const indexHex = i.toString(16).padStart(64, '0');
          const pairResult = await client.call({
            to: CONTRACTS.FACTORY,
            data: `0x1e3dd18b${indexHex}` as `0x${string}`, // allPairs(uint256) selector
          });
          
          if (!pairResult.data) continue;
          
          const pairAddress = `0x${pairResult.data.slice(-40)}` as `0x${string}`;

          // Get token0 and token1
          const [token0Result, token1Result] = await Promise.all([
            client.call({ to: pairAddress, data: '0x0dfe1681' }), // token0() selector
            client.call({ to: pairAddress, data: '0xd21220a7' }), // token1() selector
          ]);

          if (token0Result.data && token1Result.data) {
            pairs.push({
              address: pairAddress,
              token0: `0x${token0Result.data.slice(-40)}`.toLowerCase(),
              token1: `0x${token1Result.data.slice(-40)}`.toLowerCase(),
            });
          }
        } catch (e) {
          console.error(`Error fetching pair ${i}:`, e);
        }
      }

      setPairData(pairs);
    } catch (error) {
      console.error('Error fetching pairs:', error);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const client = createClient();
    const txs: Transaction[] = [];

    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock = currentBlock - BigInt(30000); // Last ~30000 blocks

      // Fetch wrap/unwrap events from WETH contract
      const [depositLogs, withdrawalLogs] = await Promise.all([
        client.getLogs({
          address: CONTRACTS.WETH,
          event: DEPOSIT_EVENT,
          args: { dst: address },
          fromBlock,
          toBlock: currentBlock,
        }).catch(() => []),
        client.getLogs({
          address: CONTRACTS.WETH,
          event: WITHDRAWAL_EVENT,
          args: { src: address },
          fromBlock,
          toBlock: currentBlock,
        }).catch(() => []),
      ]);

      // Process deposit (wrap) events
      for (const log of depositLogs) {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          txs.push({
            hash: log.transactionHash,
            type: 'wrap',
            tokenIn: 'PHRS',
            tokenOut: 'WPHRS',
            amountIn: formatUnits(log.args.wad || BigInt(0), 18),
            amountOut: formatUnits(log.args.wad || BigInt(0), 18),
            status: 'success',
            timestamp: new Date(Number(block.timestamp) * 1000),
            blockNumber: log.blockNumber,
          });
        } catch (e) {
          // Skip failed block fetch
        }
      }

      // Process withdrawal (unwrap) events
      for (const log of withdrawalLogs) {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          txs.push({
            hash: log.transactionHash,
            type: 'unwrap',
            tokenIn: 'WPHRS',
            tokenOut: 'PHRS',
            amountIn: formatUnits(log.args.wad || BigInt(0), 18),
            amountOut: formatUnits(log.args.wad || BigInt(0), 18),
            status: 'success',
            timestamp: new Date(Number(block.timestamp) * 1000),
            blockNumber: log.blockNumber,
          });
        } catch (e) {
          // Skip failed block fetch
        }
      }

      // Fetch swap, mint, burn events from all pairs
      for (const pair of pairData) {
        const token0Symbol = getTokenSymbol(pair.token0);
        const token1Symbol = getTokenSymbol(pair.token1);
        const token0Decimals = getTokenDecimals(pair.token0);
        const token1Decimals = getTokenDecimals(pair.token1);

        try {
          // Fetch swap events where user is the receiver (to)
          const swapLogs = await client.getLogs({
            address: pair.address,
            event: SWAP_EVENT,
            args: { to: address },
            fromBlock,
            toBlock: currentBlock,
          }).catch(() => []);

          for (const log of swapLogs) {
            try {
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const { amount0In, amount1In, amount0Out, amount1Out } = log.args;

              let tokenIn = token0Symbol;
              let tokenOut = token1Symbol;
              let amountIn = formatUnits(amount0In || BigInt(0), token0Decimals);
              let amountOut = formatUnits(amount1Out || BigInt(0), token1Decimals);

              if ((amount1In || BigInt(0)) > BigInt(0)) {
                tokenIn = token1Symbol;
                tokenOut = token0Symbol;
                amountIn = formatUnits(amount1In || BigInt(0), token1Decimals);
                amountOut = formatUnits(amount0Out || BigInt(0), token0Decimals);
              }

              txs.push({
                hash: log.transactionHash,
                type: 'swap',
                tokenIn,
                tokenOut,
                amountIn,
                amountOut,
                status: 'success',
                timestamp: new Date(Number(block.timestamp) * 1000),
                blockNumber: log.blockNumber,
                pairAddress: pair.address,
              });
            } catch (e) {
              // Skip failed block fetch
            }
          }

          // Fetch mint events (add liquidity) where user is sender
          const mintLogs = await client.getLogs({
            address: pair.address,
            event: MINT_EVENT,
            args: { sender: address },
            fromBlock,
            toBlock: currentBlock,
          }).catch(() => []);

          for (const log of mintLogs) {
            try {
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const { amount0, amount1 } = log.args;

              txs.push({
                hash: log.transactionHash,
                type: 'addLiquidity',
                tokenIn: `${token0Symbol}+${token1Symbol}`,
                tokenOut: 'LP',
                amountIn: `${parseFloat(formatUnits(amount0 || BigInt(0), token0Decimals)).toFixed(4)} + ${parseFloat(formatUnits(amount1 || BigInt(0), token1Decimals)).toFixed(4)}`,
                amountOut: 'LP Tokens',
                status: 'success',
                timestamp: new Date(Number(block.timestamp) * 1000),
                blockNumber: log.blockNumber,
                pairAddress: pair.address,
              });
            } catch (e) {
              // Skip failed block fetch
            }
          }

          // Fetch burn events (remove liquidity) where user receives tokens
          const burnLogs = await client.getLogs({
            address: pair.address,
            event: BURN_EVENT,
            args: { to: address },
            fromBlock,
            toBlock: currentBlock,
          }).catch(() => []);

          for (const log of burnLogs) {
            try {
              const block = await client.getBlock({ blockNumber: log.blockNumber });
              const { amount0, amount1 } = log.args;

              txs.push({
                hash: log.transactionHash,
                type: 'removeLiquidity',
                tokenIn: 'LP',
                tokenOut: `${token0Symbol}+${token1Symbol}`,
                amountIn: 'LP Tokens',
                amountOut: `${parseFloat(formatUnits(amount0 || BigInt(0), token0Decimals)).toFixed(4)} + ${parseFloat(formatUnits(amount1 || BigInt(0), token1Decimals)).toFixed(4)}`,
                status: 'success',
                timestamp: new Date(Number(block.timestamp) * 1000),
                blockNumber: log.blockNumber,
                pairAddress: pair.address,
              });
            } catch (e) {
              // Skip failed block fetch
            }
          }
        } catch (error) {
          console.error(`Error fetching events for pair ${pair.address}:`, error);
        }
      }

      // Remove duplicates and sort by block number (most recent first)
      const uniqueTxs = txs.filter((tx, index, self) =>
        index === self.findIndex(t => t.hash === tx.hash && t.type === tx.type)
      );
      uniqueTxs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
      
      setTransactions(uniqueTxs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, pairData, getTokenSymbol, getTokenDecimals]);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  useEffect(() => {
    if (address) {
      fetchTransactions();
    }
  }, [address, pairData, fetchTransactions]);

  return {
    transactions,
    isLoading,
    refetch: fetchTransactions,
  };
};
