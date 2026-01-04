import { Helmet } from 'react-helmet-async';
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History as HistoryIcon, 
  ArrowRight, 
  ExternalLink,
  RefreshCw,
  Clock,
  CheckCircle2,
  Droplets,
  ArrowLeftRight,
  Wallet,
  Plus,
  Minus
} from 'lucide-react';
import { PHAROS_TESTNET } from '@/config/contracts';
import { useTransactionHistory, Transaction } from '@/hooks/useTransactionHistory';
import { useState } from 'react';

const getTokenLogo = (symbol: string): string => {
  const logoMap: Record<string, string> = {
    'PHRS': '/tokens/phrs.png',
    'WPHRS': '/tokens/phrs.png',
    'OCTO': '/tokens/octo.png',
    'BNB': '/tokens/bnb.png',
    'ETH': '/tokens/eth.png',
    'USDC': '/tokens/usdc.png',
    'LP': '/tokens/octo.png',
  };
  return logoMap[symbol] || '/tokens/octo.png';
};

const History = () => {
  const { address, isConnected } = useAccount();
  const { transactions, isLoading, refetch } = useTransactionHistory();
  const [activeFilter, setActiveFilter] = useState<'all' | 'swap' | 'liquidity' | 'wrap'>('all');

  const handleRefresh = () => {
    refetch();
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'swap') return tx.type === 'swap';
    if (activeFilter === 'wrap') return tx.type === 'wrap' || tx.type === 'unwrap';
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
        return <ArrowLeftRight className="w-4 h-4" />;
      case 'wrap':
      case 'unwrap':
        return <RefreshCw className="w-4 h-4" />;
      case 'addLiquidity':
        return <Plus className="w-4 h-4" />;
      case 'removeLiquidity':
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: Transaction['type']) => {
    const config = {
      swap: { label: 'Swap', className: 'bg-primary/20 text-primary' },
      wrap: { label: 'Wrap', className: 'bg-cyan-500/20 text-cyan-400' },
      unwrap: { label: 'Unwrap', className: 'bg-cyan-500/20 text-cyan-400' },
      addLiquidity: { label: 'Add Liquidity', className: 'bg-green-500/20 text-green-400' },
      removeLiquidity: { label: 'Remove Liquidity', className: 'bg-orange-500/20 text-orange-400' },
    };
    return config[type];
  };

  // Stats
  const stats = {
    totalTxs: transactions.length,
    swaps: transactions.filter(t => t.type === 'swap').length,
    wraps: transactions.filter(t => t.type === 'wrap' || t.type === 'unwrap').length,
    liquidity: transactions.filter(t => t.type === 'addLiquidity' || t.type === 'removeLiquidity').length,
  };

  return (
    <>
      <Helmet>
        <title>Transaction History | OCTOPUS DEX</title>
        <meta name="description" content="View your on-chain transaction history on OCTOPUS DEX" />
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
              View your on-chain swaps and operations
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
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.swaps}</p>
                <p className="text-sm text-muted-foreground">Swaps</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.wraps}</p>
                <p className="text-sm text-muted-foreground">Wrap/Unwrap</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.liquidity}</p>
                <p className="text-sm text-muted-foreground">Liquidity</p>
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
                      ? `On-chain transactions for ${address?.slice(0, 6)}...${address?.slice(-4)}`
                      : 'Connect wallet to view your transactions'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-secondary/30 rounded-lg p-1 flex-wrap">
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
                      onClick={() => setActiveFilter('wrap')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeFilter === 'wrap' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Wrap
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
                  <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Connect Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet to view transaction history
                  </p>
                </div>
              ) : isLoading ? (
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
                    Your on-chain transaction history will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredTransactions.map((tx, index) => {
                      const typeBadge = getTypeBadge(tx.type);
                      const isLiquidityTx = tx.type === 'addLiquidity' || tx.type === 'removeLiquidity';
                      
                      return (
                        <div
                          key={`${tx.hash}-${tx.type}-${index}`}
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
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            
                            {isLiquidityTx ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">{tx.amountIn}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium text-foreground">{tx.amountOut}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <img src={getTokenLogo(tx.tokenIn!)} alt="" className="w-4 h-4 rounded-full" />
                                  <span className="font-medium text-foreground">{parseFloat(tx.amountIn!).toFixed(4)}</span>
                                  <span className="text-muted-foreground">{tx.tokenIn}</span>
                                </div>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <div className="flex items-center gap-1">
                                  <img src={getTokenLogo(tx.tokenOut!)} alt="" className="w-4 h-4 rounded-full" />
                                  <span className="font-medium text-foreground">{parseFloat(tx.amountOut!).toFixed(4)}</span>
                                  <span className="text-muted-foreground">{tx.tokenOut}</span>
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

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="font-medium text-foreground mb-2">On-Chain Data</h4>
            <p className="text-sm text-muted-foreground">
              Transaction history is fetched directly from the Pharos Atlantic Testnet blockchain. 
              All swaps, wrap/unwrap, and liquidity operations are tracked in real-time.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default History;
