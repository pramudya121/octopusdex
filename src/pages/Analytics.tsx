import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Repeat } from 'lucide-react';

// Mock data for charts
const volumeData = [
  { date: 'Dec 7', volume: 0 },
  { date: 'Dec 8', volume: 0 },
  { date: 'Dec 9', volume: 0 },
  { date: 'Dec 10', volume: 0 },
  { date: 'Dec 11', volume: 0 },
  { date: 'Dec 12', volume: 0 },
  { date: 'Dec 13', volume: 0 },
];

const tvlData = [
  { date: 'Dec 7', tvl: 0 },
  { date: 'Dec 8', tvl: 0 },
  { date: 'Dec 9', tvl: 0 },
  { date: 'Dec 10', tvl: 0 },
  { date: 'Dec 11', tvl: 0 },
  { date: 'Dec 12', tvl: 0 },
  { date: 'Dec 13', tvl: 0 },
];

const topTokens = [
  { symbol: 'OCTO', name: 'Octopus Token', price: '$0.00', change: 0, volume: '$0' },
  { symbol: 'ETH', name: 'Ethereum', price: '$0.00', change: 0, volume: '$0' },
  { symbol: 'BNB', name: 'Binance Coin', price: '$0.00', change: 0, volume: '$0' },
  { symbol: 'USDC', name: 'USD Coin', price: '$1.00', change: 0, volume: '$0' },
];

const recentTxs = [
  { type: 'Swap', from: 'OCTO', to: 'USDC', amount: '0', time: 'Just now', hash: '0x...' },
];

const Analytics = () => {
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
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track trading volume, TVL, and market activity</p>
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
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 0%
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
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 0%
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-warning/10">
                  <Repeat className="w-5 h-5 text-warning" />
                </div>
                <span className="text-sm text-muted-foreground">24h Transactions</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 0%
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 0%
              </p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Volume Chart */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Trading Volume</h3>
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
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(222, 47%, 8%)', 
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(187, 100%, 42%)"
                      fill="url(#volumeGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TVL Chart */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Total Value Locked</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tvlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 20%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(222, 47%, 8%)', 
                        border: '1px solid hsl(217, 33%, 20%)',
                        borderRadius: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tvl"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top Tokens */}
          <Card className="glass-card overflow-hidden mb-8">
            <div className="p-6 border-b border-border/50">
              <h3 className="text-lg font-semibold">Top Tokens</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Token</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">24h Change</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {topTokens.map((token, index) => (
                    <tr key={token.symbol} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-muted-foreground">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold">{token.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{token.price}</td>
                      <td className={`p-4 text-right ${token.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {token.change >= 0 ? '+' : ''}{token.change}%
                      </td>
                      <td className="p-4 text-right text-muted-foreground">{token.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
            </div>
            <div className="p-6 text-center text-muted-foreground">
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
