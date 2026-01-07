import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACTS, TOKENS, Token } from '@/config/contracts';

const getAmountsOutAbi = [
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

// USDC is our price reference (1 USDC = $1)
const USDC_DECIMALS = 6;

export const useTokenPrice = (token: Token | null) => {
  const isUSDC = token?.address.toLowerCase() === TOKENS.USDC.toLowerCase();
  const isNative = token?.isNative;
  
  // Get token address for routing (use WPHRS for native PHRS)
  const tokenAddress = useMemo(() => {
    if (!token) return null;
    if (isNative) return TOKENS.WPHRS;
    return token.address;
  }, [token, isNative]);

  // Check if token is already USDC
  const needsQuote = tokenAddress && 
    tokenAddress.toLowerCase() !== TOKENS.USDC.toLowerCase();

  // Create path: Token -> WPHRS -> USDC (or Token -> USDC if direct)
  const path = useMemo(() => {
    if (!tokenAddress || !needsQuote) return [];
    
    // If token is WPHRS, direct to USDC
    if (tokenAddress.toLowerCase() === TOKENS.WPHRS.toLowerCase()) {
      return [TOKENS.WPHRS, TOKENS.USDC];
    }
    
    // Otherwise: Token -> WPHRS -> USDC
    return [tokenAddress, TOKENS.WPHRS, TOKENS.USDC];
  }, [tokenAddress, needsQuote]);

  // Amount to query (1 token)
  const amountIn = useMemo(() => {
    if (!token) return BigInt(0);
    return parseUnits('1', token.decimals);
  }, [token]);

  const { data: amountsOut, isLoading } = useReadContract({
    address: CONTRACTS.ROUTER,
    abi: getAmountsOutAbi,
    functionName: 'getAmountsOut',
    args: [amountIn, path],
    query: {
      enabled: needsQuote && path.length >= 2 && amountIn > BigInt(0),
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  const priceUSD = useMemo(() => {
    if (!token) return null;
    
    // USDC = $1
    if (isUSDC) return 1;
    
    // If no quote needed or loading
    if (!needsQuote || isLoading) return null;
    
    // Parse amounts out
    if (amountsOut && amountsOut.length > 0) {
      const usdcAmount = amountsOut[amountsOut.length - 1];
      return parseFloat(formatUnits(usdcAmount, USDC_DECIMALS));
    }
    
    return null;
  }, [token, isUSDC, needsQuote, isLoading, amountsOut]);

  return {
    priceUSD,
    isLoading: needsQuote ? isLoading : false,
    formattedPrice: priceUSD !== null 
      ? `$${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
      : null,
  };
};

// Hook to get USD value of a specific amount
export const useAmountUSD = (token: Token | null, amount: string) => {
  const { priceUSD, isLoading } = useTokenPrice(token);
  
  const valueUSD = useMemo(() => {
    if (!priceUSD || !amount || isNaN(parseFloat(amount))) return null;
    return parseFloat(amount) * priceUSD;
  }, [priceUSD, amount]);

  return {
    valueUSD,
    isLoading,
    formattedValue: valueUSD !== null
      ? `$${valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null,
  };
};
