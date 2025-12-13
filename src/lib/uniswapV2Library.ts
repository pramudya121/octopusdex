// UniswapV2Library implementation in TypeScript
// These are utility functions matching the on-chain library

import { parseUnits, formatUnits } from 'viem';

// Constants
const FEE_NUMERATOR = BigInt(997);
const FEE_DENOMINATOR = BigInt(1000);

/**
 * Returns sorted token addresses, used for pair calculation
 */
export const sortTokens = (tokenA: `0x${string}`, tokenB: `0x${string}`): [`0x${string}`, `0x${string}`] => {
  if (tokenA.toLowerCase() < tokenB.toLowerCase()) {
    return [tokenA, tokenB];
  }
  return [tokenB, tokenA];
};

/**
 * Given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
 * quote = amountA * reserveB / reserveA
 */
export const quote = (amountA: bigint, reserveA: bigint, reserveB: bigint): bigint => {
  if (amountA <= BigInt(0)) return BigInt(0);
  if (reserveA <= BigInt(0) || reserveB <= BigInt(0)) return BigInt(0);
  
  return (amountA * reserveB) / reserveA;
};

/**
 * Given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
 * Uses the constant product formula with 0.3% fee
 * amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
 */
export const getAmountOut = (amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint => {
  if (amountIn <= BigInt(0)) return BigInt(0);
  if (reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) return BigInt(0);
  
  const amountInWithFee = amountIn * FEE_NUMERATOR;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
  
  return numerator / denominator;
};

/**
 * Given an output amount of an asset and pair reserves, returns the required input amount of the other asset
 * amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997) + 1
 */
export const getAmountIn = (amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint => {
  if (amountOut <= BigInt(0)) return BigInt(0);
  if (reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) return BigInt(0);
  if (amountOut >= reserveOut) return BigInt(0); // Cannot get more than reserve
  
  const numerator = reserveIn * amountOut * FEE_DENOMINATOR;
  const denominator = (reserveOut - amountOut) * FEE_NUMERATOR;
  
  return numerator / denominator + BigInt(1);
};

/**
 * Performs chained getAmountOut calculations on any number of pairs
 */
export const getAmountsOut = (
  amountIn: bigint,
  path: `0x${string}`[],
  reserves: { reserveIn: bigint; reserveOut: bigint }[]
): bigint[] => {
  if (path.length < 2) return [amountIn];
  if (reserves.length !== path.length - 1) return [amountIn];

  const amounts: bigint[] = [amountIn];
  
  for (let i = 0; i < path.length - 1; i++) {
    const amountOut = getAmountOut(amounts[i], reserves[i].reserveIn, reserves[i].reserveOut);
    amounts.push(amountOut);
  }
  
  return amounts;
};

/**
 * Performs chained getAmountIn calculations on any number of pairs
 */
export const getAmountsIn = (
  amountOut: bigint,
  path: `0x${string}`[],
  reserves: { reserveIn: bigint; reserveOut: bigint }[]
): bigint[] => {
  if (path.length < 2) return [amountOut];
  if (reserves.length !== path.length - 1) return [amountOut];

  const amounts: bigint[] = new Array(path.length).fill(BigInt(0));
  amounts[amounts.length - 1] = amountOut;
  
  for (let i = path.length - 1; i > 0; i--) {
    const amountIn = getAmountIn(amounts[i], reserves[i - 1].reserveIn, reserves[i - 1].reserveOut);
    amounts[i - 1] = amountIn;
  }
  
  return amounts;
};

/**
 * Calculate price impact percentage
 * priceImpact = (executionPrice - spotPrice) / spotPrice * 100
 */
export const calculatePriceImpact = (
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number => {
  if (amountIn <= BigInt(0) || reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) return 0;
  
  // Spot price = reserveOut / reserveIn
  // Execution price = amountOut / amountIn
  // Price impact = 1 - (execution / spot) = 1 - (amountOut * reserveIn) / (amountIn * reserveOut)
  
  const spotNumerator = reserveOut * amountIn;
  const executionNumerator = amountOut * reserveIn;
  
  if (spotNumerator <= BigInt(0)) return 0;
  
  const impact = Number(spotNumerator - executionNumerator) / Number(spotNumerator) * 100;
  return Math.max(0, impact);
};

/**
 * Calculate minimum amount out with slippage
 */
export const calculateMinimumAmountOut = (amountOut: bigint, slippagePercent: number): bigint => {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
  const bpsBase = BigInt(10000);
  return (amountOut * (bpsBase - slippageBps)) / bpsBase;
};

/**
 * Calculate LP tokens received for adding liquidity
 * If first liquidity: sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
 * Otherwise: min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
 */
export const calculateLiquidityMinted = (
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): bigint => {
  if (totalSupply === BigInt(0)) {
    // First liquidity provider
    const product = amountA * amountB;
    const sqrt = BigInt(Math.floor(Math.sqrt(Number(product))));
    const MINIMUM_LIQUIDITY = BigInt(1000);
    return sqrt > MINIMUM_LIQUIDITY ? sqrt - MINIMUM_LIQUIDITY : BigInt(0);
  }
  
  const liquidityA = (amountA * totalSupply) / reserveA;
  const liquidityB = (amountB * totalSupply) / reserveB;
  
  return liquidityA < liquidityB ? liquidityA : liquidityB;
};

/**
 * Calculate amounts received when removing liquidity
 */
export const calculateRemoveLiquidityAmounts = (
  liquidity: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): { amountA: bigint; amountB: bigint } => {
  if (totalSupply === BigInt(0)) return { amountA: BigInt(0), amountB: BigInt(0) };
  
  const amountA = (liquidity * reserveA) / totalSupply;
  const amountB = (liquidity * reserveB) / totalSupply;
  
  return { amountA, amountB };
};

/**
 * Format a bigint balance to a readable string with decimals
 */
export const formatBalance = (balance: bigint, decimals: number, displayDecimals: number = 6): string => {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num < 0.000001) return '<0.000001';
  return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
};

/**
 * Parse a string amount to bigint
 */
export const parseAmount = (amount: string, decimals: number): bigint => {
  if (!amount || isNaN(parseFloat(amount))) return BigInt(0);
  try {
    return parseUnits(amount, decimals);
  } catch {
    return BigInt(0);
  }
};
