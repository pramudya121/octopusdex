import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Activity, DollarSign, Users, Repeat, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllPairsLength, usePairAddress, usePairDetails } from '@/hooks/usePools';
import { TOKEN_LIST, CONTRACTS, getTokenByAddress } from '@/config/contracts';
import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';
import phrsLogo from '@/assets/tokens/octo.png';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'PHRS': case 'WPHRS': return phrsLogo;
    case 'OCTO': return octoLogo;
    case 'BNB': return bnbLogo;
    case 'ETH': return ethLogo;
    case 'USDC': return usdcLogo;
    default: return octoLogo;
  }
};

// Generate mock historical data
const generateHistoricalData = (days: number, baseValue: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variation = Math.random() * 0.4 - 0.2; // ±20% variation
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(0, baseValue * (1 + variation * (days - i) / days)),
    });
  }
  return data;
};

const COLORS = ['hsl(187, 100%, 42%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

// Pool Stats Component
const PoolStats = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1 } = usePairDetails(pairAddress);
  
  if (!token0 || !token1) return null;
  
  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;
  
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img src={getTokenLogo(token0Symbol)} alt={token0Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
            <img src={getTokenLogo(token1Symbol)} alt={token1Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
          </div>
          <span className="font-medium">{token0Symbol}/{token1Symbol}</span>
        </div>
      </td>
      <td className="p-4 text-right">{parseFloat(reserve0).toFixed(2)} {token0Symbol}</td>
      <td className="p-4 text-right">{parseFloat(reserve1).toFixed(2)} {token1Symbol}</td>
      <td className="p-4 text-right text-success">0.30%</td>
    </tr>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { pairsCount, isLoading } = useAllPairsLength();
  
  const volumeData = generateHistoricalData(7, 0);
  const tvlData = generateHistoricalData(7, 0);
  
  const poolIndices = Array.from({ length: Math.min(pairsCount, 10) }, (_, i) => i);

  // Token distribution for pie chart
  const tokenDistribution = TOKEN_LIST.filter(t => !t.isNative && t.symbol !== 'WPHRS').map((token, i) => ({
    name: token.symbol,
    value: 25, // Equal distribution for mock
    color: COLORS[i % COLORS.length],
  }));

  return (
    <>
      <Helmet>
        <title>Analytics - OCTOPUS DEX</title>
        <meta name="description" content="View trading analytics, volume charts, and token statistics on OCTOPUS DEX." />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics</h1>
              <p className="text-muted-foreground">Track trading volume, TVL, and market activity</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">TVL</span>
              </div>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-success mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Starting fresh
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-success/10">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">24h Volume</span>
              </div>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Awaiting trades</p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-warning/10">
                  <Repeat className="w-5 h-5 text-warning" />
                </div>
                <span className="text-sm text-muted-foreground">Total Pools</span>
              </div>
              <p className="text-2xl font-bold">{pairsCount}</p>
              <p className="text-sm text-muted-foreground mt-1">Active pairs</p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Network</span>
              </div>
              <p className="text-2xl font-bold">Pharos</p>
              <p className="text-sm text-muted-foreground mt-1">Atlantic Testnet</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Volume Chart */}
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Trading Volume</h3>
                <div className="flex gap-1">
                  {['24h', '7d', '30d'].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'Volume']}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(187, 100%, 42%)" fill="url(#volumeGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TVL Chart */}
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Value Locked</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tvlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'TVL']}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Token Distribution & Pool Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Token Distribution Pie Chart */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Token Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tokenDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {tokenDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 8%)',
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {tokenDistribution.map((token) => (
                  <div key={token.name} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color }} />
                    <span>{token.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pool Performance */}
            <Card className="glass-card p-6 lg:col-span-2 overflow-hidden">
              <h3 className="text-lg font-semibold mb-4">Pool Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pool</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Reserve 0</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Reserve 1</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolIndices.length > 0 ? (
                      poolIndices.map((index) => (
                        <PoolStats key={index} index={index} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No pools created yet. Be the first to add liquidity!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <a
                href={`https://pharos-atlantic-testnet.socialscan.io`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Explorer
                </Button>
              </a>
            </div>
            <div className="p-12 text-center text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Transactions will appear here once users start trading</p>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Analytics;
