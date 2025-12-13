import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { Helmet } from 'react-helmet-async';
import { 
  TrendingUp, TrendingDown, Activity, DollarSign, Users, Repeat, RefreshCw, 
  ExternalLink, Layers, Zap, BarChart3, ArrowUpRight, ArrowDownRight, 
  Clock, Flame, Target, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllPairsLength, usePairAddress, usePairDetails } from '@/hooks/usePools';
import { TOKEN_LIST, CONTRACTS, getTokenByAddress, PHAROS_TESTNET } from '@/config/contracts';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

const generateHourlyData = () => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date();
    hour.setHours(hour.getHours() - i);
    data.push({
      hour: hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }),
      swaps: Math.floor(Math.random() * 50 + 10),
      volume: Math.floor(Math.random() * 5000 + 1000),
    });
  }
  return data;
};

const COLORS = ['hsl(187, 100%, 42%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{prefix}{displayValue.toFixed(decimals)}{suffix}</>;
};

// Pool Stats Row Component
const PoolStatsRow = ({ index }: { index: number }) => {
  const pairAddress = usePairAddress(index);
  const { token0, token1, reserve0, reserve1 } = usePairDetails(pairAddress);
  
  if (!token0 || !token1) return null;
  
  const token0Symbol = token0.symbol === 'WPHRS' ? 'PHRS' : token0.symbol;
  const token1Symbol = token1.symbol === 'WPHRS' ? 'PHRS' : token1.symbol;
  const tvl = (parseFloat(reserve0) + parseFloat(reserve1)).toFixed(2);
  const mockVolume = ((parseFloat(reserve0) + parseFloat(reserve1)) * 0.1).toFixed(2);
  const mockAPR = ((parseFloat(reserve0) + parseFloat(reserve1)) % 25 + 5).toFixed(1);
  const change = (Math.random() * 20 - 10).toFixed(2);
  const isPositive = parseFloat(change) >= 0;
  
  return (
    <tr className="border-b border-border/20 hover:bg-secondary/30 transition-all duration-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img src={getTokenLogo(token0Symbol)} alt={token0Symbol} className="w-10 h-10 rounded-full border-2 border-background shadow-md" />
            <img src={getTokenLogo(token1Symbol)} alt={token1Symbol} className="w-10 h-10 rounded-full border-2 border-background shadow-md" />
          </div>
          <div>
            <span className="font-bold text-lg">{token0Symbol}/{token1Symbol}</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-2 py-0">0.30% fee</Badge>
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 text-right">
        <p className="font-bold text-lg">${tvl}</p>
        <p className="text-xs text-muted-foreground">TVL</p>
      </td>
      <td className="p-4 text-right">
        <p className="font-semibold">${mockVolume}</p>
        <p className="text-xs text-muted-foreground">24h</p>
      </td>
      <td className="p-4 text-right hidden md:table-cell">
        <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="font-semibold">{change}%</span>
        </div>
      </td>
      <td className="p-4 text-right">
        <Badge className="bg-success/10 text-success border-success/30 font-bold">
          {mockAPR}%
        </Badge>
      </td>
      <td className="p-4 text-right">
        <Link to="/liquidity">
          <Button variant="outline" size="sm">Trade</Button>
        </Link>
      </td>
    </tr>
  );
};

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'primary',
  prefix = '',
  suffix = ''
}: { 
  title: string; 
  value: string; 
  change: string; 
  icon: any; 
  color?: string;
  prefix?: string;
  suffix?: string;
}) => {
  const isPositive = !change.startsWith('-');
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };
  
  return (
    <Card className="glass-card p-6 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 group-hover:opacity-30 transition-opacity ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[0]}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">{change}</span>
          </div>
        </div>
        <p className="text-3xl font-bold mb-1">{prefix}{value}{suffix}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeChart, setActiveChart] = useState('volume');
  const { pairsCount, isLoading } = useAllPairsLength();
  
  const volumeData = generateVolumeData(timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30);
  const tvlData = generateTVLData(timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30);
  const hourlyData = generateHourlyData();
  
  const poolIndices = Array.from({ length: Math.min(pairsCount, 10) }, (_, i) => i);

  // Token distribution for pie chart
  const tokenDistribution = TOKEN_LIST.filter(t => !t.isNative && t.symbol !== 'WPHRS').map((token, i) => ({
    name: token.symbol,
    value: Math.floor(Math.random() * 30 + 15),
    color: COLORS[i % COLORS.length],
  }));

  // Radial data for top tokens
  const radialData = TOKEN_LIST.filter(t => !t.isNative && t.symbol !== 'WPHRS').map((token, i) => ({
    name: token.symbol,
    value: Math.floor(Math.random() * 100),
    fill: COLORS[i % COLORS.length],
  }));

  // Calculate totals
  const totalVolume = volumeData.reduce((acc, d) => acc + d.volume, 0);
  const latestTVL = tvlData[tvlData.length - 1]?.tvl || 0;
  const totalTrades = volumeData.reduce((acc, d) => acc + d.trades, 0);
  const avgVolume = totalVolume / volumeData.length;

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
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">
                  <span className="text-gradient">Analytics</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">Real-time insights into OCTOPUS DEX performance</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="py-2 px-4 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-success mr-2" />
                Live Data
              </Badge>
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
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatsCard 
              title="Total Value Locked" 
              value={(latestTVL / 1000).toFixed(1) + 'K'} 
              change="+12.5%" 
              icon={DollarSign} 
              color="primary"
              prefix="$"
            />
            <StatsCard 
              title="Trading Volume" 
              value={(totalVolume / 1000).toFixed(1) + 'K'} 
              change="+8.3%" 
              icon={BarChart3} 
              color="success"
              prefix="$"
            />
            <StatsCard 
              title="Total Trades" 
              value={totalTrades.toString()} 
              change="+24.7%" 
              icon={Repeat} 
              color="warning"
            />
            <StatsCard 
              title="Active Pools" 
              value={pairsCount.toString()} 
              change="Pharos" 
              icon={Layers} 
              color="primary"
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Volume & TVL Combined Chart */}
            <Card className="glass-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Performance Overview</h3>
                  <p className="text-sm text-muted-foreground">Volume and TVL trends</p>
                </div>
                <Tabs value={activeChart} onValueChange={setActiveChart}>
                  <TabsList className="bg-secondary/50">
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                    <TabsTrigger value="tvl">TVL</TabsTrigger>
                    <TabsTrigger value="combined">Combined</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart === 'volume' ? (
                    <BarChart data={volumeData}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(187, 100%, 42%)" stopOpacity={1} />
                          <stop offset="100%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(215, 20%, 45%)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 47%, 11%)',
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '12px',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                      />
                      <Bar dataKey="volume" fill="url(#volumeGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : activeChart === 'tvl' ? (
                    <AreaChart data={tvlData}>
                      <defs>
                        <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(215, 20%, 45%)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(215, 20%, 45%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 47%, 11%)',
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '12px',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'TVL']}
                      />
                      <Area type="monotone" dataKey="tvl" stroke="hsl(142, 71%, 45%)" fill="url(#tvlGradient)" strokeWidth={3} />
                    </AreaChart>
                  ) : (
                    <ComposedChart data={tvlData}>
                      <defs>
                        <linearGradient id="tvlAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                      <XAxis dataKey="date" stroke="hsl(215, 20%, 45%)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="hsl(142, 71%, 45%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(38, 92%, 50%)" fontSize={12} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 47%, 11%)',
                          border: '1px solid hsl(217, 33%, 20%)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="tvl" name="TVL" stroke="hsl(142, 71%, 45%)" fill="url(#tvlAreaGradient)" strokeWidth={2} />
                      <Bar yAxisId="right" dataKey="fees" name="Fees" fill="hsl(38, 92%, 50%)" opacity={0.8} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Activity Heatmap / Token Distribution */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-2">Token Distribution</h3>
              <p className="text-sm text-muted-foreground mb-6">Liquidity share by token</p>
              
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tokenDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
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
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {tokenDistribution.map((token) => (
                  <div key={token.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color }} />
                    <img src={getTokenLogo(token.name)} alt={token.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm font-medium">{token.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">{token.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Hourly Activity */}
          <Card className="glass-card p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  24h Activity
                </h3>
                <p className="text-sm text-muted-foreground">Hourly trading activity</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Swaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span>Volume</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" vertical={false} />
                  <XAxis dataKey="hour" stroke="hsl(215, 20%, 45%)" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                  <YAxis yAxisId="left" stroke="hsl(187, 100%, 42%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(142, 71%, 45%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(1)}K`} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 11%)',
                      border: '1px solid hsl(217, 33%, 20%)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="swaps" fill="hsl(187, 100%, 42%)" opacity={0.8} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="volume" stroke="hsl(142, 71%, 45%)" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pool Performance Table */}
          <Card className="glass-card p-6 mb-10 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-warning" />
                  Top Pools
                </h3>
                <p className="text-sm text-muted-foreground">Ranked by performance</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/pools">
                  <Button variant="outline" size="sm">
                    View All Pools
                  </Button>
                </Link>
                <a
                  href={PHAROS_TESTNET.blockExplorers.default.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                </a>
              </div>
            </div>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/20">
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Pool</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">TVL</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Volume</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">24h Change</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">APR</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {poolIndices.length > 0 ? (
                    poolIndices.map((index) => (
                      <PoolStatsRow key={index} index={index} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No pools available</p>
                        <p className="text-sm mt-1">Create the first pool to see analytics</p>
                        <Link to="/liquidity">
                          <Button variant="glow" className="mt-4">Create Pool</Button>
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Network Stats */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Network Information
                </h3>
                <p className="text-sm text-muted-foreground">Pharos Atlantic Testnet</p>
              </div>
              <a
                href={PHAROS_TESTNET.blockExplorers.default.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Explorer
                </Button>
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Chain ID</p>
                <p className="text-xl font-bold text-gradient">{PHAROS_TESTNET.id}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Native Token</p>
                <div className="flex items-center justify-center gap-2">
                  <img src="/tokens/phrs.png" alt="PHRS" className="w-5 h-5 rounded-full" />
                  <p className="text-xl font-bold">PHRS</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Block Time</p>
                <p className="text-xl font-bold text-success">~2s</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Protocol</p>
                <p className="text-xl font-bold">UniswapV2</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <p className="text-xl font-bold text-success">Active</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Analytics;