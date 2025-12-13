import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { CONTRACTS, TOKEN_LIST } from '@/config/contracts';
import { FACTORY_ABI, PAIR_ABI } from '@/config/abis';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'OCTO': return octoLogo;
    case 'BNB': return bnbLogo;
    case 'ETH': return ethLogo;
    case 'USDC': return usdcLogo;
    default: return octoLogo;
  }
};

interface PoolData {
  pairAddress: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  tvl: string;
}

const Pools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pools, setPools] = useState<PoolData[]>([]);

  // Get all pairs length
  const { data: pairsLength } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'allPairsLength',
  });

  // Get first few pairs (we'll expand this with multicall later)
  const { data: pair0 } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'allPairs',
    args: pairsLength && (pairsLength as bigint) > 0n ? [0n] : undefined,
  });

  // Get OCTO/USDC pair directly
  const { data: octoUsdcPair } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [TOKEN_LIST[1].address, TOKEN_LIST[4].address], // OCTO/USDC
  });

  // Get OCTO/ETH pair
  const { data: octoEthPair } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [TOKEN_LIST[1].address, TOKEN_LIST[3].address], // OCTO/ETH
  });

  // Get OCTO/BNB pair
  const { data: octoBnbPair } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [TOKEN_LIST[1].address, TOKEN_LIST[2].address], // OCTO/BNB
  });

  const totalPairs = pairsLength ? Number(pairsLength) : 0;

  const mockPools = [
    {
      token0: 'OCTO',
      token1: 'USDC',
      tvl: '$0',
      volume24h: '$0',
      apr: '0%',
      pairAddress: octoUsdcPair || '',
    },
    {
      token0: 'OCTO',
      token1: 'ETH',
      tvl: '$0',
      volume24h: '$0',
      apr: '0%',
      pairAddress: octoEthPair || '',
    },
    {
      token0: 'OCTO',
      token1: 'BNB',
      tvl: '$0',
      volume24h: '$0',
      apr: '0%',
      pairAddress: octoBnbPair || '',
    },
  ];

  const filteredPools = mockPools.filter(
    (pool) =>
      pool.token0.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Pools - OCTOPUS DEX</title>
        <meta name="description" content="Explore liquidity pools on OCTOPUS DEX. View TVL, volume, and APR for all trading pairs." />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pools</h1>
              <p className="text-muted-foreground">Explore liquidity pools and earn fees</p>
            </div>
            <Link to="/liquidity">
              <Button variant="glow" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Position
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Pools</p>
              <p className="text-2xl font-bold text-gradient">{totalPairs}</p>
            </Card>
            <Card className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total TVL</p>
              <p className="text-2xl font-bold text-gradient">$0</p>
            </Card>
            <Card className="glass-card p-4 col-span-2 md:col-span-1">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-2xl font-bold text-gradient">$0</p>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search pools by token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card/50 border-border/50"
            />
          </div>

          {/* Pools Table */}
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pool</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">TVL</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">24h Volume</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">APR</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPools.map((pool, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <img
                              src={getTokenLogo(pool.token0)}
                              alt={pool.token0}
                              className="w-8 h-8 rounded-full border-2 border-background"
                            />
                            <img
                              src={getTokenLogo(pool.token1)}
                              alt={pool.token1}
                              className="w-8 h-8 rounded-full border-2 border-background"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{pool.token0}/{pool.token1}</p>
                            {pool.pairAddress && pool.pairAddress !== '0x0000000000000000000000000000000000000000' && (
                              <p className="text-xs text-muted-foreground">
                                {(pool.pairAddress as string).slice(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{pool.tvl}</td>
                      <td className="p-4 text-right text-muted-foreground hidden md:table-cell">{pool.volume24h}</td>
                      <td className="p-4 text-right text-success hidden md:table-cell">{pool.apr}</td>
                      <td className="p-4 text-right">
                        <Link to="/liquidity">
                          <Button variant="outline" size="sm">
                            Add
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPools.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pools found</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default Pools;
