import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { Token, CONTRACTS } from '@/config/contracts';
import { toast } from 'sonner';

const DEADLINE_MINUTES = 20;
const SLIPPAGE = 0.5;

// Minimal ABIs
const getPairAbi = [{ inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }], name: 'getPair', outputs: [{ name: 'pair', type: 'address' }], stateMutability: 'view', type: 'function' }] as const;
const getReservesAbi = [{ inputs: [], name: 'getReserves', outputs: [{ name: '_reserve0', type: 'uint112' }, { name: '_reserve1', type: 'uint112' }, { name: '_blockTimestampLast', type: 'uint32' }], stateMutability: 'view', type: 'function' }] as const;
const balanceOfAbi = [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }] as const;
const totalSupplyAbi = [{ inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }] as const;
const allowanceAbi = [{ inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }] as const;
const token0Abi = [{ inputs: [], name: 'token0', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' }] as const;
const token1Abi = [{ inputs: [], name: 'token1', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' }] as const;

export const useLiquidity = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const useGetPair = (tokenA: Token | null, tokenB: Token | null) => {
    const tokenAAddress = tokenA?.isNative ? CONTRACTS.WETH : tokenA?.address;
    const tokenBAddress = tokenB?.isNative ? CONTRACTS.WETH : tokenB?.address;
    const { data: pairAddress } = useReadContract({
      address: CONTRACTS.FACTORY, abi: getPairAbi, functionName: 'getPair',
      args: tokenAAddress && tokenBAddress ? [tokenAAddress, tokenBAddress] : undefined,
      query: { enabled: !!tokenA && !!tokenB },
    });
    return pairAddress as `0x${string}` | undefined;
  };

  const useGetReserves = (pairAddress: `0x${string}` | undefined) => {
    const { data: reserves } = useReadContract({
      address: pairAddress, abi: getReservesAbi, functionName: 'getReserves',
      query: { enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    if (!reserves) return { reserve0: BigInt(0), reserve1: BigInt(0) };
    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    return { reserve0, reserve1 };
  };

  const useGetLPBalance = (pairAddress: `0x${string}` | undefined) => {
    const { data: balance, refetch } = useReadContract({
      address: pairAddress, abi: balanceOfAbi, functionName: 'balanceOf',
      args: address ? [address] : undefined,
      query: { enabled: !!pairAddress && !!address && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    return { balance: (balance as bigint) || BigInt(0), refetch };
  };

  const useGetTotalSupply = (pairAddress: `0x${string}` | undefined) => {
    const { data: totalSupply } = useReadContract({
      address: pairAddress, abi: totalSupplyAbi, functionName: 'totalSupply',
      query: { enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    return (totalSupply as bigint) || BigInt(0);
  };

  const useGetLPAllowance = (pairAddress: `0x${string}` | undefined) => {
    const { data: allowance, refetch } = useReadContract({
      address: pairAddress, abi: allowanceAbi, functionName: 'allowance',
      args: address ? [address, CONTRACTS.ROUTER] : undefined,
      query: { enabled: !!pairAddress && !!address && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    return { allowance: (allowance as bigint) || BigInt(0), refetch };
  };

  const useGetPairTokens = (pairAddress: `0x${string}` | undefined) => {
    const { data: token0 } = useReadContract({
      address: pairAddress, abi: token0Abi, functionName: 'token0',
      query: { enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    const { data: token1 } = useReadContract({
      address: pairAddress, abi: token1Abi, functionName: 'token1',
      query: { enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' },
    });
    return { token0: token0 as `0x${string}` | undefined, token1: token1 as `0x${string}` | undefined };
  };

  const approve = useCallback(async (token: Token) => {
    if (!address || token.isNative) return;
    try {
      toast.loading('Approving token...', { id: 'approve' });
      const hash = await writeContractAsync({
        address: token.address,
        abi: [{ inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
        functionName: 'approve', args: [CONTRACTS.ROUTER, maxUint256],
      } as any);
      toast.success('Token approved!', { id: 'approve' });
      return hash;
    } catch (error: any) { toast.error(error.shortMessage || 'Approval failed', { id: 'approve' }); throw error; }
  }, [address, writeContractAsync]);

  const approveLPToken = useCallback(async (pairAddress: `0x${string}`) => {
    if (!address) return;
    try {
      toast.loading('Approving LP tokens...', { id: 'approve-lp' });
      const hash = await writeContractAsync({
        address: pairAddress,
        abi: [{ inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
        functionName: 'approve', args: [CONTRACTS.ROUTER, maxUint256],
      } as any);
      toast.success('LP tokens approved!', { id: 'approve-lp' });
      return hash;
    } catch (error: any) { toast.error(error.shortMessage || 'Approval failed', { id: 'approve-lp' }); throw error; }
  }, [address, writeContractAsync]);

  const addLiquidity = useCallback(async (tokenA: Token, tokenB: Token, amountA: string, amountB: string) => {
    if (!address) return;
    setIsLoading(true);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
    const amountADesired = parseUnits(amountA, tokenA.decimals);
    const amountBDesired = parseUnits(amountB, tokenB.decimals);
    const amountAMin = amountADesired * BigInt(995) / BigInt(1000);
    const amountBMin = amountBDesired * BigInt(995) / BigInt(1000);

    try {
      toast.loading('Adding liquidity...', { id: 'liquidity' });
      let hash: `0x${string}`;

      if (tokenA.isNative || tokenB.isNative) {
        const token = tokenA.isNative ? tokenB : tokenA;
        const tokenAmount = tokenA.isNative ? amountBDesired : amountADesired;
        const tokenMin = tokenA.isNative ? amountBMin : amountAMin;
        const ethAmount = tokenA.isNative ? amountADesired : amountBDesired;
        const ethMin = tokenA.isNative ? amountAMin : amountBMin;
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'token', type: 'address' }, { name: 'amountTokenDesired', type: 'uint256' }, { name: 'amountTokenMin', type: 'uint256' }, { name: 'amountETHMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'addLiquidityETH', outputs: [{ name: 'amountToken', type: 'uint256' }, { name: 'amountETH', type: 'uint256' }, { name: 'liquidity', type: 'uint256' }], stateMutability: 'payable', type: 'function' }],
          functionName: 'addLiquidityETH', args: [token.address, tokenAmount, tokenMin, ethMin, address, deadline], value: ethAmount,
        } as any);
      } else {
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'amountADesired', type: 'uint256' }, { name: 'amountBDesired', type: 'uint256' }, { name: 'amountAMin', type: 'uint256' }, { name: 'amountBMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'addLiquidity', outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }, { name: 'liquidity', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }],
          functionName: 'addLiquidity', args: [tokenA.address, tokenB.address, amountADesired, amountBDesired, amountAMin, amountBMin, address, deadline],
        } as any);
      }
      toast.success('Liquidity added!', { id: 'liquidity' });
      return hash;
    } catch (error: any) { console.error('Add liquidity error:', error); toast.error(error.shortMessage || 'Failed', { id: 'liquidity' }); throw error; }
    finally { setIsLoading(false); }
  }, [address, writeContractAsync]);

  const removeLiquidity = useCallback(async (
    tokenA: Token, tokenB: Token, lpAmount: bigint, amountAMin: bigint, amountBMin: bigint
  ) => {
    if (!address) return;
    setIsLoading(true);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);

    try {
      toast.loading('Removing liquidity...', { id: 'remove-liquidity' });
      let hash: `0x${string}`;

      if (tokenA.isNative || tokenB.isNative) {
        const token = tokenA.isNative ? tokenB : tokenA;
        const tokenMin = tokenA.isNative ? amountBMin : amountAMin;
        const ethMin = tokenA.isNative ? amountAMin : amountBMin;
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'token', type: 'address' }, { name: 'liquidity', type: 'uint256' }, { name: 'amountTokenMin', type: 'uint256' }, { name: 'amountETHMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'removeLiquidityETH', outputs: [{ name: 'amountToken', type: 'uint256' }, { name: 'amountETH', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }],
          functionName: 'removeLiquidityETH', args: [token.address, lpAmount, tokenMin, ethMin, address, deadline],
        } as any);
      } else {
        hash = await writeContractAsync({
          address: CONTRACTS.ROUTER,
          abi: [{ inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'liquidity', type: 'uint256' }, { name: 'amountAMin', type: 'uint256' }, { name: 'amountBMin', type: 'uint256' }, { name: 'to', type: 'address' }, { name: 'deadline', type: 'uint256' }], name: 'removeLiquidity', outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }],
          functionName: 'removeLiquidity', args: [tokenA.address, tokenB.address, lpAmount, amountAMin, amountBMin, address, deadline],
        } as any);
      }
      toast.success('Liquidity removed!', { id: 'remove-liquidity' });
      return hash;
    } catch (error: any) { console.error('Remove liquidity error:', error); toast.error(error.shortMessage || 'Failed', { id: 'remove-liquidity' }); throw error; }
    finally { setIsLoading(false); }
  }, [address, writeContractAsync]);

  return { addLiquidity, removeLiquidity, approve, approveLPToken, useGetPair, useGetReserves, useGetLPBalance, useGetTotalSupply, useGetLPAllowance, useGetPairTokens, isLoading };
};
