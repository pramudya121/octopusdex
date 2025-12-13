import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ExternalLink, Loader2, TrendingUp, Droplets, Zap, Filter, ArrowUpDown } from 'lucide-react';
import { CONTRACTS, TOKEN_LIST, getTokenByAddress } from '@/config/contracts';
import { formatUnits } from 'viem';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAllPairsLength, usePairAddress, usePairDetails } from '@/hooks/usePools';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'PHRS': case 'WPHRS': return '/tokens/phrs.png';
    case 'OCTO': return '/tokens/octo.png';
    case 'BNB': return '/tokens/bnb.png';
    case 'ETH': return '/tokens/eth.png';
    case 'USDC': return '/tokens/usdc.png';
    default: return '/tokens/octo.png';
  }
};

// Pool Card Component
const PoolCard = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1, totalSupply } = usePairDetails(pairAddress);

  if (!pairAddress || !token0 || !token1) return null;

  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;

  // Calculate mock APR based on reserves
  const mockAPR = ((parseFloat(reserve0) + parseFloat(reserve1)) % 25 + 5).toFixed(1);

  return (
    <Card className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex -space-x-3">
              <img
                src={getTokenLogo(token0Symbol)}
                alt={token0Symbol}
                className="w-12 h-12 rounded-full border-3 border-background shadow-lg"
              />
              <img
                src={getTokenLogo(token1Symbol)}
                alt={token1Symbol}
                className="w-12 h-12 rounded-full border-3 border-background shadow-lg"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center">
              <Zap className="w-3 h-3 text-success-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold">{token0Symbol}/{token1Symbol}</h3>
            <p className="text-sm text-muted-foreground font-mono">
              {pairAddress.slice(0, 10)}...{pairAddress.slice(-8)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          Active
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Reserve {token0Symbol}</p>
          <p className="text-lg font-bold">{parseFloat(reserve0).toFixed(4)}</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">Reserve {token1Symbol}</p>
          <p className="text-lg font-bold">{parseFloat(reserve1).toFixed(4)}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between py-4 border-t border-border/30 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm text-muted-foreground">APR</span>
        </div>
        <span className="text-lg font-bold text-success">{mockAPR}%</span>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Fee</span>
        </div>
        <span className="font-semibold">0.30%</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link to="/liquidity" className="flex-1">
          <Button variant="glow" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </Link>
        <a 
          href={`https://pharos-atlantic-testnet.socialscan.io/address/${pairAddress}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="icon">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
    </Card>
  );
};

const Pools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('tvl');
  const { pairsCount, isLoading } = useAllPairsLength();

  // Create array of indices for pools
  const poolIndices = Array.from({ length: Math.min(pairsCount, 20) }, (_, i) => i);

  return (
    <>
      <Helmet>
        <title>Pools - OCTOPUS DEX</title>
        <meta name="description" content="Explore liquidity pools on OCTOPUS DEX. View reserves, fees, and add liquidity to trading pairs on Pharos Atlantic Testnet." />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Liquidity Pools</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Provide liquidity to earn trading fees and maximize your yield on Pharos Network
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Card className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-gradient">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : pairsCount}
              </p>
              <p className="text-sm text-muted-foreground">Active Pools</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <p className="text-3xl font-bold text-success">0.30%</p>
              <p className="text-sm text-muted-foreground">Swap Fee</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <p className="text-3xl font-bold text-warning">Instant</p>
              <p className="text-sm text-muted-foreground">Settlement</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <img src="/tokens/phrs.png" alt="Pharos" className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gradient">Pharos</p>
              <p className="text-sm text-muted-foreground">Network</p>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search pools by token name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-card/50 border-border/50 text-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-14 px-6">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="h-14 px-6">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
              <Link to="/liquidity">
                <Button variant="glow" className="h-14 px-8">
                  <Plus className="w-5 h-5 mr-2" />
                  New Position
                </Button>
              </Link>
            </div>
          </div>

          {/* Pools Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl text-muted-foreground">Loading pools from blockchain...</p>
            </div>
          ) : pairsCount === 0 ? (
            <Card className="glass-card p-16 text-center">
              <Droplets className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-bold mb-3">No Pools Found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Be the first to create a liquidity pool and start earning trading fees!
              </p>
              <Link to="/liquidity">
                <Button variant="glow" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Pool
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poolIndices.map((index) => (
                <PoolCard key={index} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Pools;
