import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { Token, CONTRACTS } from '@/config/contracts';

const getReservesAbi = [{
  inputs: [],
  name: 'getReserves',
  outputs: [
    { name: '_reserve0', type: 'uint112' },
    { name: '_reserve1', type: 'uint112' },
    { name: '_blockTimestampLast', type: 'uint32' },
  ],
  stateMutability: 'view',
  type: 'function',
}] as const;

const getPairAbi = [{
  inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }],
  name: 'getPair',
  outputs: [{ name: 'pair', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

const token0Abi = [{
  inputs: [],
  name: 'token0',
  outputs: [{ name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

export interface PriceImpactResult {
  priceImpact: number; // Percentage
  severity: 'low' | 'medium' | 'high' | 'critical';
  warning: string | null;
}

export const usePriceImpact = (
  amountIn: bigint,
  tokenIn: Token | null,
  tokenOut: Token | null
): PriceImpactResult => {
  const tokenInAddress = tokenIn?.isNative ? CONTRACTS.WETH : tokenIn?.address;
  const tokenOutAddress = tokenOut?.isNative ? CONTRACTS.WETH : tokenOut?.address;

  // Get pair address
  const { data: pairAddress } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: getPairAbi,
    functionName: 'getPair',
    args: tokenInAddress && tokenOutAddress ? [tokenInAddress, tokenOutAddress] : undefined,
    query: { enabled: !!tokenInAddress && !!tokenOutAddress },
  });

  // Get reserves
  const { data: reserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: getReservesAbi,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Get token0 to determine order
  const { data: token0Address } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: token0Abi,
    functionName: 'token0',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return useMemo(() => {
    const defaultResult: PriceImpactResult = {
      priceImpact: 0,
      severity: 'low',
      warning: null,
    };

    if (!reserves || !token0Address || !tokenIn || !tokenOut || amountIn === BigInt(0)) {
      return defaultResult;
    }

    try {
      const [reserve0, reserve1] = reserves as [bigint, bigint, number];
      const isTokenInToken0 = token0Address.toLowerCase() === tokenInAddress?.toLowerCase();

      const reserveIn = isTokenInToken0 ? reserve0 : reserve1;
      const reserveOut = isTokenInToken0 ? reserve1 : reserve0;

      if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
        return defaultResult;
      }

      // Calculate price impact using constant product formula
      // Price impact = 1 - (reserveIn / (reserveIn + amountIn))
      // This represents how much the price changes due to the trade

      const amountInWithFee = amountIn * BigInt(997); // 0.3% fee
      const numerator = amountInWithFee * reserveOut;
      const denominator = reserveIn * BigInt(1000) + amountInWithFee;
      const amountOut = numerator / denominator;

      // Calculate execution price vs spot price
      // Spot price = reserveOut / reserveIn
      // Execution price = amountOut / amountIn

      const spotPrice = Number(reserveOut) / Number(reserveIn);
      const executionPrice = Number(amountOut) / Number(amountIn);

      // Price impact = (spotPrice - executionPrice) / spotPrice * 100
      const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;

      // Determine severity and warning
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let warning: string | null = null;

      if (priceImpact >= 15) {
        severity = 'critical';
        warning = 'Extremely high price impact! You may lose a significant portion of your funds.';
      } else if (priceImpact >= 5) {
        severity = 'high';
        warning = 'High price impact. Consider reducing the swap amount.';
      } else if (priceImpact >= 3) {
        severity = 'medium';
        warning = 'Moderate price impact. Your trade will move the market price.';
      } else if (priceImpact >= 1) {
        severity = 'low';
        warning = 'Low price impact detected.';
      }

      return {
        priceImpact: Math.max(0, priceImpact),
        severity,
        warning,
      };
    } catch (error) {
      console.error('Error calculating price impact:', error);
      return defaultResult;
    }
  }, [reserves, token0Address, tokenIn, tokenOut, amountIn, tokenInAddress]);
};
