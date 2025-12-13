import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History as HistoryIcon, 
  ArrowRight, 
  ArrowUpRight, 
  ExternalLink,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Droplets,
  ArrowLeftRight
} from 'lucide-react';
import { PHAROS_TESTNET, TOKEN_LIST } from '@/config/contracts';

interface Transaction {
  hash: string;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'wrap' | 'unwrap';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  blockNumber: number;
}

const getTokenLogo = (symbol: string): string => {
  const logoMap: Record<string, string> = {
    'PHRS': '/tokens/phrs.png',
    'WPHRS': '/tokens/phrs.png',
    'OCTO': '/tokens/octo.png',
    'BNB': '/tokens/bnb.png',
    'ETH': '/tokens/eth.png',
    'USDC': '/tokens/usdc.png',
  };
  return logoMap[symbol] || '/tokens/octo.png';
};

// Mock transaction history for demonstration
const generateMockTransactions = (): Transaction[] => {
  const types: Transaction['type'][] = ['swap', 'addLiquidity', 'removeLiquidity', 'wrap', 'unwrap'];
  const tokens = ['OCTO', 'ETH', 'BNB', 'USDC', 'PHRS', 'WPHRS'];
  const statuses: Transaction['status'][] = ['success', 'success', 'success', 'failed', 'pending'];
  
  return Array.from({ length: 15 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const tokenIn = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    while (tokenOut === tokenIn) {
      tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    }
    
    return {
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      type,
      tokenIn,
      tokenOut,
      amountIn: (Math.random() * 100).toFixed(4),
      amountOut: (Math.random() * 100).toFixed(4),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const History = () => {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'swap' | 'liquidity'>('all');

  useEffect(() => {
    // Simulate loading transactions
    const timer = setTimeout(() => {
      setTransactions(generateMockTransactions());
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTransactions(generateMockTransactions());
      setIsLoading(false);
    }, 1000);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'swap') return tx.type === 'swap' || tx.type === 'wrap' || tx.type === 'unwrap';
    if (activeFilter === 'liquidity') return tx.type === 'addLiquidity' || tx.type === 'removeLiquidity';
    return true;
  });

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'swap':
      case 'wrap':
      case 'unwrap':
        return <ArrowLeftRight className="w-4 h-4" />;
      case 'addLiquidity':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'removeLiquidity':
        return <Droplets className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const config = {
      swap: { label: 'Swap', className: 'bg-primary/20 text-primary' },
      wrap: { label: 'Wrap', className: 'bg-cyan-500/20 text-cyan-400' },
      unwrap: { label: 'Unwrap', className: 'bg-cyan-500/20 text-cyan-400' },
      addLiquidity: { label: 'Add Liquidity', className: 'bg-success/20 text-success' },
      removeLiquidity: { label: 'Remove Liquidity', className: 'bg-warning/20 text-warning' },
    };
    return config[type];
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
    }
  };

  // Stats
  const stats = {
    totalTxs: transactions.length,
    successTxs: transactions.filter(t => t.status === 'success').length,
    swaps: transactions.filter(t => t.type === 'swap').length,
    liquidityOps: transactions.filter(t => t.type === 'addLiquidity' || t.type === 'removeLiquidity').length,
  };

  return (
    <>
      <Helmet>
        <title>Transaction History | OCTOPUS DEX</title>
        <meta name="description" content="View your transaction history on OCTOPUS DEX" />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
              <HistoryIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Transaction History
            </h1>
            <p className="text-muted-foreground">
              View your recent swaps and liquidity operations
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.totalTxs}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-success/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">{stats.successTxs}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.swaps}</p>
                <p className="text-sm text-muted-foreground">Swaps</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-warning/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.liquidityOps}</p>
                <p className="text-sm text-muted-foreground">Liquidity Ops</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Card */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    {isConnected 
                      ? `Showing transactions for ${address?.slice(0, 6)}...${address?.slice(-4)}`
                      : 'Connect wallet to view your transactions'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-secondary/30 rounded-lg p-1">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveFilter('swap')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeFilter === 'swap' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Swaps
                    </button>
                    <button
                      onClick={() => setActiveFilter('liquidity')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeFilter === 'liquidity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Liquidity
                    </button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <HistoryIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Transactions</h3>
                  <p className="text-muted-foreground">
                    Your transaction history will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredTransactions.map((tx) => {
                      const typeBadge = getTypeBadge(tx.type);
                      return (
                        <div
                          key={tx.hash}
                          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 transition-all group"
                        >
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                            {getTypeIcon(tx.type)}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className={typeBadge.className}>
                                {typeBadge.label}
                              </Badge>
                              {getStatusIcon(tx.status)}
                            </div>
                            {tx.type === 'swap' ? (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <img src={getTokenLogo(tx.tokenIn!)} alt="" className="w-4 h-4 rounded-full" />
                                  <span className="font-medium text-foreground">{tx.amountIn}</span>
                                  <span className="text-muted-foreground">{tx.tokenIn}</span>
                                </div>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <div className="flex items-center gap-1">
                                  <img src={getTokenLogo(tx.tokenOut!)} alt="" className="w-4 h-4 rounded-full" />
                                  <span className="font-medium text-foreground">{tx.amountOut}</span>
                                  <span className="text-muted-foreground">{tx.tokenOut}</span>
                                </div>
                              </div>
                            ) : tx.type === 'wrap' || tx.type === 'unwrap' ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {tx.type === 'wrap' ? 'Wrapped' : 'Unwrapped'} {tx.amountIn} {tx.type === 'wrap' ? 'PHRS' : 'WPHRS'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <img src={getTokenLogo(tx.tokenIn!)} alt="" className="w-4 h-4 rounded-full" />
                                  <img src={getTokenLogo(tx.tokenOut!)} alt="" className="w-4 h-4 rounded-full -ml-2" />
                                  <span className="text-muted-foreground">
                                    {tx.tokenIn}/{tx.tokenOut} Pool
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Time & Link */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(tx.timestamp)}
                            </div>
                            <a
                              href={`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default History;
