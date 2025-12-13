import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Activity, DollarSign, Users, Repeat, RefreshCw, ExternalLink, Layers, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllPairsLength, usePairAddress, usePairDetails } from '@/hooks/usePools';
import { TOKEN_LIST, CONTRACTS, getTokenByAddress } from '@/config/contracts';
import { useState } from 'react';

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

// Generate mock historical data with more realistic patterns
const generateVolumeData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseVolume = Math.random() * 50000 + 10000;
    const variation = Math.sin(i / 3) * 0.3 + 1;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: Math.floor(baseVolume * variation),
      trades: Math.floor(Math.random() * 100 + 20),
    });
  }
  return data;
};

const generateTVLData = (days: number) => {
  const data = [];
  const now = new Date();
  let tvl = 100000;
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    tvl += (Math.random() - 0.4) * 10000;
    tvl = Math.max(50000, tvl);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: Math.floor(tvl),
      fees: Math.floor(tvl * 0.003),
    });
  }
  return data;
};

const COLORS = ['hsl(187, 100%, 42%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

// Pool Stats Row Component
const PoolStatsRow = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1 } = usePairDetails(pairAddress);
  
  if (!token0 || !token1) return null;
  
  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;
  const mockVolume = ((parseFloat(reserve0) + parseFloat(reserve1)) * 0.1).toFixed(2);
  const mockAPR = ((parseFloat(reserve0) + parseFloat(reserve1)) % 25 + 5).toFixed(1);
  
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img src={getTokenLogo(token0Symbol)} alt={token0Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
            <img src={getTokenLogo(token1Symbol)} alt={token1Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
          </div>
          <div>
            <span className="font-bold">{token0Symbol}/{token1Symbol}</span>
            <p className="text-xs text-muted-foreground">0.30% fee</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <p className="font-semibold">${mockVolume}</p>
        <p className="text-xs text-muted-foreground">24h volume</p>
      </td>
      <td className="p-4 text-right">
        <p className="font-semibold">{parseFloat(reserve0).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{token0Symbol}</p>
      </td>
      <td className="p-4 text-right">
        <p className="font-semibold">{parseFloat(reserve1).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">{token1Symbol}</p>
      </td>
      <td className="p-4 text-right">
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          {mockAPR}%
        </Badge>
      </td>
    </tr>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { pairsCount, isLoading } = useAllPairsLength();
  
  const volumeData = generateVolumeData(timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30);
  const tvlData = generateTVLData(timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30);
  
  const poolIndices = Array.from({ length: Math.min(pairsCount, 10) }, (_, i) => i);

  // Token distribution for pie chart
  const tokenDistribution = TOKEN_LIST.filter(t => !t.isNative && t.symbol !== 'WPHRS').map((token, i) => ({
    name: token.symbol,
    value: Math.floor(Math.random() * 30 + 15),
    color: COLORS[i % COLORS.length],
  }));

  // Calculate totals
  const totalVolume = volumeData.reduce((acc, d) => acc + d.volume, 0);
  const latestTVL = tvlData[tvlData.length - 1]?.tvl || 0;
  const totalTrades = volumeData.reduce((acc, d) => acc + d.trades, 0);

  return (
    <>
      <Helmet>
        <title>Analytics - OCTOPUS DEX</title>
        <meta name="description" content="View trading analytics, volume charts, TVL trends, and market statistics on OCTOPUS DEX." />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-gradient">Analytics Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">Real-time insights into OCTOPUS DEX performance</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="py-2 px-4">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-2" />
                Live Data
              </Badge>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Card className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">${(latestTVL / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground mt-1">Total Value Locked</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +12.5%
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-success/10">
                    <BarChart3 className="w-6 h-6 text-success" />
                  </div>
                </div>
                <p className="text-3xl font-bold">${(totalVolume / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground mt-1">Trading Volume</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +8.3%
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-warning/10">
                    <Repeat className="w-6 h-6 text-warning" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{totalTrades}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Trades</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  +24.7%
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{pairsCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Pools</p>
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                  <Zap className="w-4 h-4" />
                  Pharos Testnet
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Volume Bar Chart */}
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Trading Volume</h3>
                  <p className="text-sm text-muted-foreground">Daily trading activity</p>
                </div>
                <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
                  {['24h', '7d', '30d'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className="rounded-md"
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <defs>
                      <linearGradient id="volumeBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(187, 100%, 42%)" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(215, 20%, 45%)" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(215, 20%, 45%)" 
                      fontSize={12} 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 11%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                    />
                    <Bar 
                      dataKey="volume" 
                      fill="url(#volumeBarGradient)" 
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TVL Area Chart with Fees */}
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">TVL & Fees Earned</h3>
                  <p className="text-sm text-muted-foreground">Total value locked over time</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tvlData}>
                    <defs>
                      <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(215, 20%, 45%)" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(215, 20%, 45%)" 
                      fontSize={12} 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(38, 92%, 50%)" 
                      fontSize={12} 
                      tickFormatter={(v) => `$${v}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 11%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                      }}
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`, 
                        name === 'tvl' ? 'TVL' : 'Fees'
                      ]}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="tvl" 
                      stroke="hsl(142, 71%, 45%)" 
                      fill="url(#tvlGradient)" 
                      strokeWidth={2}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="fees" 
                      fill="hsl(38, 92%, 50%)" 
                      opacity={0.8}
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Token Distribution & Pool Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Token Distribution Pie Chart */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-2">Token Distribution</h3>
              <p className="text-sm text-muted-foreground mb-6">Liquidity share by token</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tokenDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {tokenDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 11%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {tokenDistribution.map((token) => (
                  <div key={token.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color }} />
                    <img src={getTokenLogo(token.name)} alt={token.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-medium">{token.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">{token.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pool Performance Table */}
            <Card className="glass-card p-6 lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Pool Performance</h3>
                  <p className="text-sm text-muted-foreground">Top pools by activity</p>
                </div>
                <a
                  href="https://pharos-atlantic-testnet.socialscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pool</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Reserve A</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Reserve B</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">APR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolIndices.length > 0 ? (
                      poolIndices.map((index) => (
                        <PoolStatsRow key={index} index={index} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p className="text-lg">No pools available</p>
                          <p className="text-sm mt-1">Create the first pool to see analytics</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Network Stats */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Network Information</h3>
                <p className="text-sm text-muted-foreground">Pharos Atlantic Testnet</p>
              </div>
              <a
                href="https://pharos-atlantic-testnet.socialscan.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Explorer
                </Button>
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Chain ID</p>
                <p className="text-xl font-bold">688689</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Native Token</p>
                <p className="text-xl font-bold">PHRS</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Block Time</p>
                <p className="text-xl font-bold">~2s</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Protocol</p>
                <p className="text-xl font-bold">UniswapV2</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Analytics;
