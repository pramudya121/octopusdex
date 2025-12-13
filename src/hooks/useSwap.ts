import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { Token, CONTRACTS } from '@/config/contracts';
import { toast } from 'sonner';

const SLIPPAGE = 0.5;
const DEADLINE_MINUTES = 20;

const getAmountsOutAbi = [{
  inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'path', type: 'address[]' }],
  name: 'getAmountsOut',
  outputs: [{ name: 'amounts', type: 'uint256[]' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

const allowanceAbi = [{
  inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
  name: 'allowance',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

export const useSwap = () => {
  const { address } = useAccount();
  const [isSwapping, setIsSwapping] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { writeContractAsync } = useWriteContract();

  const useGetAmountsOut = (amountIn: string, tokenIn: Token | null, tokenOut: Token | null) => {
    const parsedAmount = amountIn && tokenIn ? parseUnits(amountIn || '0', tokenIn.decimals) : BigInt(0);
    const tokenInAddress = tokenIn?.isNative ? CONTRACTS.WETH : tokenIn?.address;
    const tokenOutAddress = tokenOut?.isNative ? CONTRACTS.WETH : tokenOut?.address;
    
    const { data, isLoading, error } = useReadContract({
      address: CONTRACTS.ROUTER,
      abi: getAmountsOutAbi,
      functionName: 'getAmountsOut',
      args: tokenInAddress && tokenOutAddress ? [parsedAmount, [tokenInAddress, tokenOutAddress]] : undefined,
      query: { enabled: !!amountIn && parsedAmount > BigInt(0) && !!tokenIn && !!tokenOut },
    });

    const amounts = data as bigint[] | undefined;
    const amountOut = amounts && amounts.length > 1 ? amounts[1] : BigInt(0);

    return {
      amountOut: tokenOut ? formatUnits(amountOut, tokenOut.decimals) : '0',
      amountOutRaw: amountOut,
      isLoading,
      error,
    };
  };

  const useCheckAllowance = (token: Token | null) => {
    const { data: allowance, refetch } = useReadContract({
      address: token?.address as `0x${string}`,
      abi: allowanceAbi,
      functionName: 'allowance',
      args: address ? [address, CONTRACTS.ROUTER] : undefined,
      query: { enabled: !!address && !!token && !token.isNative },
    });
    return { allowance: (allowance as bigint) || BigInt(0), refetch };
  };

  const approve = useCallback(async (token: Token) => {
    if (!address || token.isNative) return;
    try {
      toast.loading('Approving token...', { id: 'approve' });
      const hash = await writeContractAsync({
        address: token.address,
        abi: [{ inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
        functionName: 'approve',
        args: [CONTRACTS.ROUTER, maxUint256],
      } as any);
      toast.success('Token approved!', { id: 'approve' });
      return hash;
    } catch (error: any) {
      toast.error(error.shortMessage || 'Approval failed', { id: 'approve' });
      throw error;
    }
  }, [address, writeContractAsync]);

  // Multi-hop swap function
  const swapWithPath = useCallback(async (
    path: `0x${string}`[],
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    amountOutMin: bigint
  ) => {
    if (!address || path.length < 2) return;
    setIsSwapping(true);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
    const slippageAmount = amountOutMin * BigInt(1000 - SLIPPAGE * 10) / BigInt(1000);

    try {
      toast.loading('Swapping...', { id: 'swap' });
      let hash: `0x${string}`;

      if (tokenIn.isNative) {
        // swapExactETHForTokens
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactETHForTokens', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable', type: 'function' }],
          functionName: 'swapExactETHForTokens',
          args: [slippageAmount, path, address, deadline],
          value: parseUnits(amountIn, 18),
        } as any);
      } else if (tokenOut.isNative) {
        // swapExactTokensForETH
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForETH', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }],
          functionName: 'swapExactTokensForETH',
          args: [parseUnits(amountIn, tokenIn.decimals), slippageAmount, path, address, deadline],
        } as any);
      } else {
        // swapExactTokensForTokens
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'amountOutMin', type: 'uint256' }, { name: 'path', type: 'address[]' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForTokens', outputs: [{ name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }],
          functionName: 'swapExactTokensForTokens',
          args: [parseUnits(amountIn, tokenIn.decimals), slippageAmount, path, address, deadline],
        } as any);
      }

      setTxHash(hash);
      toast.success('Swap successful!', { id: 'swap' });
      return hash;
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(error.shortMessage || 'Swap failed', { id: 'swap' });
      throw error;
    } finally {
      setIsSwapping(false);
    }
  }, [address, writeContractAsync]);

  const swap = useCallback(async (tokenIn: Token, tokenOut: Token, amountIn: string, amountOutMin: bigint) => {
    const tokenInAddress = tokenIn.isNative ? CONTRACTS.WETH : tokenIn.address;
    const tokenOutAddress = tokenOut.isNative ? CONTRACTS.WETH : tokenOut.address;
    return swapWithPath([tokenInAddress, tokenOutAddress], tokenIn, tokenOut, amountIn, amountOutMin);
  }, [swapWithPath]);

  return { swap, swapWithPath, approve, useGetAmountsOut, useCheckAllowance, isSwapping, txHash };
};
