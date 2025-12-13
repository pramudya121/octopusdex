import { useReadContract } from 'wagmi';
import { CONTRACTS, getTokenByAddress } from '@/config/contracts';
import { formatUnits } from 'viem';

// Minimal ABIs
const allPairsLengthAbi = [{
  inputs: [],
  name: 'allPairsLength',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

const allPairsAbi = [{
  inputs: [{ name: '', type: 'uint256' }],
  name: 'allPairs',
  outputs: [{ name: '', type: 'address' }],
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

const token1Abi = [{
  inputs: [],
  name: 'token1',
  outputs: [{ name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

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

const totalSupplyAbi = [{
  inputs: [],
  name: 'totalSupply',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

export interface Pool {
  pairAddress: `0x${string}`;
  token0Address: `0x${string}`;
  token1Address: `0x${string}`;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

export const useAllPairsLength = () => {
  const { data: pairsLength, isLoading } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: allPairsLengthAbi,
    functionName: 'allPairsLength',
  });

  return { pairsCount: Number(pairsLength || 0), isLoading };
};

export const usePairAddress = (index: number) => {
  const { data: pairAddress } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: allPairsAbi,
    functionName: 'allPairs',
    args: [BigInt(index)],
    query: {
      enabled: index >= 0,
    },
  });

  return pairAddress as `0x${string}` | undefined;
};

export const usePairDetails = (pairAddress: `0x${string}` | undefined) => {
  const { data: token0 } = useReadContract({
    address: pairAddress,
    abi: token0Abi,
    functionName: 'token0',
    query: { enabled: !!pairAddress },
  });

  const { data: token1 } = useReadContract({
    address: pairAddress,
    abi: token1Abi,
    functionName: 'token1',
    query: { enabled: !!pairAddress },
  });

  const { data: reserves } = useReadContract({
    address: pairAddress,
    abi: getReservesAbi,
    functionName: 'getReserves',
    query: { enabled: !!pairAddress },
  });

  const { data: totalSupply } = useReadContract({
    address: pairAddress,
    abi: totalSupplyAbi,
    functionName: 'totalSupply',
    query: { enabled: !!pairAddress },
  });

  const token0Data = token0 ? getTokenByAddress(token0 as string) : null;
  const token1Data = token1 ? getTokenByAddress(token1 as string) : null;

  const [reserve0, reserve1] = (reserves as [bigint, bigint, number]) || [BigInt(0), BigInt(0), 0];

  return {
    token0: token0Data,
    token1: token1Data,
    token0Address: token0 as `0x${string}`,
    token1Address: token1 as `0x${string}`,
    reserve0: token0Data ? formatUnits(reserve0, token0Data.decimals) : '0',
    reserve1: token1Data ? formatUnits(reserve1, token1Data.decimals) : '0',
    totalSupply: formatUnits((totalSupply as bigint) || BigInt(0), 18),
  };
};
