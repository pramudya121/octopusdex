import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { CONTRACTS, TOKEN_LIST, getTokenByAddress } from '@/config/contracts';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAllPairsLength, usePairAddress, usePairDetails } from '@/hooks/usePools';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';
import phrsLogo from '@/assets/tokens/octo.png';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'PHRS': return phrsLogo;
    case 'OCTO': return octoLogo;
    case 'BNB': return bnbLogo;
    case 'ETH': return ethLogo;
    case 'USDC': return usdcLogo;
    case 'WPHRS': return phrsLogo;
    default: return octoLogo;
  }
};

// Pool Row Component
const PoolRow = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1 } = usePairDetails(pairAddress);

  if (!pairAddress || !token0 || !token1) return null;

  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;

  return (
    <tr className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img
              src={getTokenLogo(token0Symbol)}
              alt={token0Symbol}
              className="w-8 h-8 rounded-full border-2 border-background"
            />
            <img
              src={getTokenLogo(token1Symbol)}
              alt={token1Symbol}
              className="w-8 h-8 rounded-full border-2 border-background"
            />
          </div>
          <div>
            <p className="font-semibold">{token0Symbol}/{token1Symbol}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {pairAddress.slice(0, 8)}...{pairAddress.slice(-6)}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <p className="font-medium">{parseFloat(reserve0).toFixed(4)} {token0Symbol}</p>
        <p className="text-sm text-muted-foreground">{parseFloat(reserve1).toFixed(4)} {token1Symbol}</p>
      </td>
      <td className="p-4 text-right hidden md:table-cell">
        <span className="text-success">0.30%</span>
      </td>
      <td className="p-4 text-right">
        <div className="flex gap-2 justify-end">
          <Link to="/liquidity">
            <Button variant="outline" size="sm">Add</Button>
          </Link>
          <a 
            href={`https://pharos-atlantic-testnet.socialscan.io/address/${pairAddress}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </td>
    </tr>
  );
};

const Pools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { pairsCount, isLoading } = useAllPairsLength();

  // Create array of indices for pools
  const poolIndices = Array.from({ length: Math.min(pairsCount, 20) }, (_, i) => i);

  return (
    <>
      <Helmet>
        <title>Pools - OCTOPUS DEX</title>
        <meta name="description" content="Explore liquidity pools on OCTOPUS DEX. View reserves, fees, and add liquidity to trading pairs." />
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
              <p className="text-2xl font-bold text-gradient">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : pairsCount}
              </p>
            </Card>
            <Card className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Swap Fee</p>
              <p className="text-2xl font-bold text-gradient">0.30%</p>
            </Card>
            <Card className="glass-card p-4 col-span-2 md:col-span-1">
              <p className="text-sm text-muted-foreground mb-1">Network</p>
              <p className="text-2xl font-bold text-gradient">Pharos</p>
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
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Reserves</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Fee</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {poolIndices.map((index) => (
                    <PoolRow key={index} index={index} />
                  ))}
                </tbody>
              </table>
            </div>

            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading pools...</p>
              </div>
            )}

            {!isLoading && pairsCount === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No pools found. Be the first to create one!</p>
                <Link to="/liquidity">
                  <Button variant="glow">Create Pool</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  );
};

export default Pools;
