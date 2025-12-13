import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { Token, CONTRACTS, TOKEN_LIST } from '@/config/contracts';
import { formatUnits } from 'viem';

const getAmountsOutAbi = [{
  inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }],
  name: 'getAmountsOut',
  outputs: [{ name: 'amounts', type: 'uint256[]' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

export interface SwapRoute {
  path: `0x${string}`[];
  pathSymbols: string[];
  amountOut: bigint;
  amountOutFormatted: string;
  isMultiHop: boolean;
}

// Get the best intermediate token for multi-hop (WPHRS is usually the most liquid)
const getBestIntermediateToken = (tokenIn: Token, tokenOut: Token): Token | null => {
  // Try WPHRS first as it's usually the most liquid
  const wphrs = TOKEN_LIST.find(t => t.symbol === 'WPHRS');
  const tokenInAddress = (tokenIn.isNative ? CONTRACTS.WETH : tokenIn.address).toLowerCase();
  const tokenOutAddress = (tokenOut.isNative ? CONTRACTS.WETH : tokenOut.address).toLowerCase();
  
  if (wphrs && 
      wphrs.address.toLowerCase() !== tokenInAddress && 
      wphrs.address.toLowerCase() !== tokenOutAddress) {
    return wphrs;
  }
  
  // Fallback to OCTO or USDC
  const fallbacks = ['OCTO', 'USDC', 'BNB', 'ETH'];
  for (const symbol of fallbacks) {
    const token = TOKEN_LIST.find(t => t.symbol === symbol);
    if (token && 
        token.address.toLowerCase() !== tokenInAddress && 
        token.address.toLowerCase() !== tokenOutAddress) {
      return token;
    }
  }
  
  return null;
};

export const useBestRoute = (
  amountIn: bigint,
  tokenIn: Token | null,
  tokenOut: Token | null
) => {
  const tokenInAddress = tokenIn?.isNative ? CONTRACTS.WETH : tokenIn?.address;
  const tokenOutAddress = tokenOut?.isNative ? CONTRACTS.WETH : tokenOut?.address;
  
  const intermediateToken = useMemo(() => {
    if (!tokenIn || !tokenOut) return null;
    return getBestIntermediateToken(tokenIn, tokenOut);
  }, [tokenIn, tokenOut]);

  // Direct path
  const directPath = useMemo(() => {
    if (!tokenInAddress || !tokenOutAddress) return undefined;
    return [tokenInAddress, tokenOutAddress] as `0x${string}`[];
  }, [tokenInAddress, tokenOutAddress]);

  // Multi-hop path through intermediate
  const multiHopPath = useMemo(() => {
    if (!tokenInAddress || !tokenOutAddress || !intermediateToken) return undefined;
    return [tokenInAddress, intermediateToken.address, tokenOutAddress] as `0x${string}`[];
  }, [tokenInAddress, tokenOutAddress, intermediateToken]);

  // Query direct route
  const { data: directAmounts, isLoading: isLoadingDirect } = useReadContract({
    address: CONTRACTS.ROUTER,
    abi: getAmountsOutAbi,
    functionName: 'getAmountsOut',
    args: directPath ? [amountIn, directPath] : undefined,
    query: { 
      enabled: !!directPath && amountIn > BigInt(0),
    },
  });

  // Query multi-hop route
  const { data: multiHopAmounts, isLoading: isLoadingMultiHop } = useReadContract({
    address: CONTRACTS.ROUTER,
    abi: getAmountsOutAbi,
    functionName: 'getAmountsOut',
    args: multiHopPath ? [amountIn, multiHopPath] : undefined,
    query: { 
      enabled: !!multiHopPath && amountIn > BigInt(0),
    },
  });

  // Find the best route
  const bestRoute = useMemo((): SwapRoute | null => {
    if (!tokenIn || !tokenOut) return null;

    const directAmountOut = directAmounts && (directAmounts as bigint[]).length > 1 
      ? (directAmounts as bigint[])[(directAmounts as bigint[]).length - 1] 
      : BigInt(0);
    
    const multiHopAmountOut = multiHopAmounts && (multiHopAmounts as bigint[]).length > 2 
      ? (multiHopAmounts as bigint[])[(multiHopAmounts as bigint[]).length - 1] 
      : BigInt(0);

    // If multi-hop is better, use it
    if (multiHopAmountOut > directAmountOut && multiHopPath && intermediateToken) {
      return {
        path: multiHopPath,
        pathSymbols: [tokenIn.symbol, intermediateToken.symbol, tokenOut.symbol],
        amountOut: multiHopAmountOut,
        amountOutFormatted: formatUnits(multiHopAmountOut, tokenOut.decimals),
        isMultiHop: true,
      };
    }

    // Default to direct path
    if (directAmountOut > BigInt(0) && directPath) {
      return {
        path: directPath,
        pathSymbols: [tokenIn.symbol, tokenOut.symbol],
        amountOut: directAmountOut,
        amountOutFormatted: formatUnits(directAmountOut, tokenOut.decimals),
        isMultiHop: false,
      };
    }

    return null;
  }, [directAmounts, multiHopAmounts, directPath, multiHopPath, tokenIn, tokenOut, intermediateToken]);

  // Get all available routes
  const allRoutes = useMemo((): SwapRoute[] => {
    if (!tokenIn || !tokenOut) return [];

    const routes: SwapRoute[] = [];

    const directAmountOut = directAmounts && (directAmounts as bigint[]).length > 1 
      ? (directAmounts as bigint[])[(directAmounts as bigint[]).length - 1] 
      : BigInt(0);
    
    const multiHopAmountOut = multiHopAmounts && (multiHopAmounts as bigint[]).length > 2 
      ? (multiHopAmounts as bigint[])[(multiHopAmounts as bigint[]).length - 1] 
      : BigInt(0);

    if (directAmountOut > BigInt(0) && directPath) {
      routes.push({
        path: directPath,
        pathSymbols: [tokenIn.symbol, tokenOut.symbol],
        amountOut: directAmountOut,
        amountOutFormatted: formatUnits(directAmountOut, tokenOut.decimals),
        isMultiHop: false,
      });
    }

    if (multiHopAmountOut > BigInt(0) && multiHopPath && intermediateToken) {
      routes.push({
        path: multiHopPath,
        pathSymbols: [tokenIn.symbol, intermediateToken.symbol, tokenOut.symbol],
        amountOut: multiHopAmountOut,
        amountOutFormatted: formatUnits(multiHopAmountOut, tokenOut.decimals),
        isMultiHop: true,
      });
    }

    // Sort by amount out (descending)
    return routes.sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1));
  }, [directAmounts, multiHopAmounts, directPath, multiHopPath, tokenIn, tokenOut, intermediateToken]);

  return {
    bestRoute,
    allRoutes,
    isLoading: isLoadingDirect || isLoadingMultiHop,
  };
};
