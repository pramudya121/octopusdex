import { useReadContract } from 'wagmi';
import { CONTRACTS, TOKEN_LIST } from '@/config/contracts';

// Simple balanceOf ABI
const balanceOfAbi = [{
  inputs: [{ name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

// Get native balance via multicall getEthBalance
const getEthBalanceAbi = [{
  inputs: [{ name: 'addr', type: 'address' }],
  name: 'getEthBalance',
  outputs: [{ name: 'balance', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

export const useNativeBalance = (userAddress: `0x${string}` | undefined) => {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.MULTICALL,
    abi: getEthBalanceAbi,
    functionName: 'getEthBalance',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return { balance: (data as bigint) || BigInt(0), isLoading };
};

// Use individual queries for token balances (simpler than multicall aggregate)
export const useTokenBalanceByAddress = (tokenAddress: `0x${string}` | undefined, userAddress: `0x${string}` | undefined) => {
  const { data, isLoading } = useReadContract({
    address: tokenAddress,
    abi: balanceOfAbi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
    },
  });

  return { balance: (data as bigint) || BigInt(0), isLoading };
};
