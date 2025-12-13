import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Plus, ExternalLink, Loader2, TrendingUp, Droplets, Zap, 
  Filter, ArrowUpDown, LayoutGrid, List, Star, ChevronDown, 
  Activity, Award, Flame, Shield
} from 'lucide-react';
import { CONTRACTS, TOKEN_LIST, getTokenByAddress, PHAROS_TESTNET } from '@/config/contracts';
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
  const [isHovered, setIsHovered] = useState(false);

  if (!pairAddress || !token0 || !token1) return null;

  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;
  const tvl = (parseFloat(reserve0) + parseFloat(reserve1)).toFixed(2);
  const mockAPR = ((parseFloat(reserve0) + parseFloat(reserve1)) % 25 + 5).toFixed(1);
  const mockVolume = ((parseFloat(reserve0) + parseFloat(reserve1)) * 0.1).toFixed(2);

  return (
    <Card 
      className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex -space-x-3">
                <img
                  src={getTokenLogo(token0Symbol)}
                  alt={token0Symbol}
                  className="w-12 h-12 rounded-full border-3 border-background shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                />
                <img
                  src={getTokenLogo(token1Symbol)}
                  alt={token1Symbol}
                  className="w-12 h-12 rounded-full border-3 border-background shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{token0Symbol}/{token1Symbol}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs px-2 py-0 bg-secondary/50">0.30% fee</Badge>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 shrink-0">
            <Activity className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>

        {/* TVL Highlight */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Value Locked</p>
              <p className="text-2xl font-bold text-gradient">${tvl}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
              <p className="text-lg font-semibold text-success">${mockVolume}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <p className="text-xs text-muted-foreground mb-1">{token0Symbol} Reserve</p>
            <div className="flex items-center gap-2">
              <img src={getTokenLogo(token0Symbol)} alt={token0Symbol} className="w-4 h-4 rounded-full" />
              <p className="font-bold">{parseFloat(reserve0).toFixed(4)}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <p className="text-xs text-muted-foreground mb-1">{token1Symbol} Reserve</p>
            <div className="flex items-center gap-2">
              <img src={getTokenLogo(token1Symbol)} alt={token1Symbol} className="w-4 h-4 rounded-full" />
              <p className="font-bold">{parseFloat(reserve1).toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* APR Display */}
        <div className="flex items-center justify-between py-4 border-t border-border/30 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Est. APR</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-2xl font-bold text-success">{mockAPR}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/liquidity" className="flex-1">
            <Button variant="glow" className="w-full group/btn">
              <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform" />
              Add Liquidity
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="px-4">
              Swap
            </Button>
          </Link>
          <a 
            href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${pairAddress}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
};

// Pool Table Row Component
const PoolTableRow = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1 } = usePairDetails(pairAddress);

  if (!pairAddress || !token0 || !token1) return null;

  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;
  const tvl = (parseFloat(reserve0) + parseFloat(reserve1)).toFixed(2);
  const mockAPR = ((parseFloat(reserve0) + parseFloat(reserve1)) % 25 + 5).toFixed(1);
  const mockVolume = ((parseFloat(reserve0) + parseFloat(reserve1)) * 0.1).toFixed(2);

  return (
    <tr className="border-b border-border/20 hover:bg-secondary/30 transition-all duration-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img src={getTokenLogo(token0Symbol)} alt={token0Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
            <img src={getTokenLogo(token1Symbol)} alt={token1Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
          </div>
          <div>
            <p className="font-bold text-lg">{token0Symbol}/{token1Symbol}</p>
            <p className="text-xs text-muted-foreground font-mono">{pairAddress.slice(0, 8)}...{pairAddress.slice(-6)}</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <p className="font-bold text-lg">${tvl}</p>
      </td>
      <td className="p-4 text-right">
        <p className="font-semibold text-success">${mockVolume}</p>
      </td>
      <td className="p-4 text-right hidden md:table-cell">
        <p className="font-semibold">{parseFloat(reserve0).toFixed(4)}</p>
        <p className="text-xs text-muted-foreground">{token0Symbol}</p>
      </td>
      <td className="p-4 text-right hidden md:table-cell">
        <p className="font-semibold">{parseFloat(reserve1).toFixed(4)}</p>
        <p className="text-xs text-muted-foreground">{token1Symbol}</p>
      </td>
      <td className="p-4 text-right">
        <Badge className="bg-success/10 text-success border-success/30 font-bold text-lg">
          {mockAPR}%
        </Badge>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link to="/liquidity">
            <Button variant="glow" size="sm">Add</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">Swap</Button>
          </Link>
        </div>
      </td>
    </tr>
  );
};

const Pools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Droplets className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Liquidity Pools</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Provide liquidity to earn trading fees and maximize your yield on Pharos Network
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Card className="glass-card p-6 text-center group hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Droplets className="w-7 h-7 text-primary" />
              </div>
              <p className="text-3xl font-bold text-gradient">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : pairsCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Active Pools</p>
            </Card>
            <Card className="glass-card p-6 text-center group hover:border-success/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-success" />
              </div>
              <p className="text-3xl font-bold text-success">0.30%</p>
              <p className="text-sm text-muted-foreground mt-1">Swap Fee</p>
            </Card>
            <Card className="glass-card p-6 text-center group hover:border-warning/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-warning" />
              </div>
              <p className="text-3xl font-bold text-warning">~2s</p>
              <p className="text-sm text-muted-foreground mt-1">Block Time</p>
            </Card>
            <Card className="glass-card p-6 text-center group hover:border-primary/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <p className="text-3xl font-bold text-gradient">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Non-Custodial</p>
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
              <div className="flex bg-secondary/50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-12 w-12"
                >
                  <LayoutGrid className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-12 w-12"
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
              <Link to="/liquidity">
                <Button variant="glow" className="h-14 px-8">
                  <Plus className="w-5 h-5 mr-2" />
                  New Position
                </Button>
              </Link>
            </div>
          </div>

          {/* Pools Content */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-primary" />
              <p className="text-2xl font-semibold mb-2">Loading Pools</p>
              <p className="text-muted-foreground">Fetching data from blockchain...</p>
            </div>
          ) : pairsCount === 0 ? (
            <Card className="glass-card p-20 text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Droplets className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-3">No Pools Found</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Be the first to create a liquidity pool and start earning trading fees!
              </p>
              <Link to="/liquidity">
                <Button variant="glow" size="lg" className="text-lg px-8 py-6">
                  <Plus className="w-6 h-6 mr-2" />
                  Create First Pool
                </Button>
              </Link>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poolIndices.map((index) => (
                <PoolCard key={index} index={index} />
              ))}
            </div>
          ) : (
            <Card className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/30">
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Pool</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">TVL</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">24h Volume</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Reserve A</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Reserve B</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">APR</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolIndices.map((index) => (
                      <PoolTableRow key={index} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* CTA Section */}
          {pairsCount > 0 && (
            <Card className="glass-card p-8 mt-10 text-center bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-2">Ready to earn?</h3>
                  <p className="text-muted-foreground">Add liquidity to start earning trading fees from every swap</p>
                </div>
                <div className="flex items-center gap-4">
                  <Link to="/analytics">
                    <Button variant="outline" size="lg">
                      <Activity className="w-5 h-5 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link to="/liquidity">
                    <Button variant="glow" size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Liquidity
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </>
  );
};

export default Pools;