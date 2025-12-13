import { useAccount, useBalance, useReadContract } from 'wagmi';
import { Token, CONTRACTS } from '@/config/contracts';
import { formatUnits } from 'viem';

// Simple ERC20 balanceOf ABI
const balanceOfAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const useTokenBalance = (token: Token | null) => {
  const { address } = useAccount();

  // Native balance (PHRS)
  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address: address,
    query: {
      enabled: !!address && !!token?.isNative,
    },
  });

  // ERC20 balance
  const { data: tokenBalance, isLoading: tokenLoading } = useReadContract({
    address: token?.address as `0x${string}`,
    abi: balanceOfAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!token && !token.isNative,
    },
  });

  if (!token || !address) {
    return { balance: '0', formatted: '0', isLoading: false };
  }

  if (token.isNative) {
    const formatted = nativeBalance?.value 
      ? formatUnits(nativeBalance.value, 18)
      : '0';
    return {
      balance: nativeBalance?.value?.toString() || '0',
      formatted,
      isLoading: nativeLoading,
    };
  }

  const balance = tokenBalance as bigint | undefined;
  return {
    balance: balance?.toString() || '0',
    formatted: balance ? formatUnits(balance, token.decimals) : '0',
    isLoading: tokenLoading,
  };
};
