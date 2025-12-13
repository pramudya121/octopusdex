import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, usePublicClient } from 'wagmi';
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
  Loader2,
  Droplets,
  ArrowLeftRight,
  Wallet
} from 'lucide-react';
import { PHAROS_TESTNET, TOKEN_LIST, CONTRACTS, getTokenByAddress } from '@/config/contracts';
import { formatUnits, parseAbiItem } from 'viem';

interface Transaction {
  hash: string;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'wrap' | 'unwrap';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  status: 'success';
  timestamp: Date;
  blockNumber: bigint;
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

const getTokenSymbol = (address: string): string => {
  const token = getTokenByAddress(address);
  if (token) {
    return token.symbol === 'WPHRS' ? 'PHRS' : token.symbol;
  }
  return address.slice(0, 6) + '...';
};

// Swap event signature for UniswapV2 Pair
const SWAP_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');
const MINT_EVENT = parseAbiItem('event Mint(address indexed sender, uint256 amount0, uint256 amount1)');
const BURN_EVENT = parseAbiItem('event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)');
const DEPOSIT_EVENT = parseAbiItem('event Deposit(address indexed dst, uint256 wad)');
const WITHDRAWAL_EVENT = parseAbiItem('event Withdrawal(address indexed src, uint256 wad)');

const History = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'swap' | 'liquidity'>('all');

  const fetchTransactions = async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const txs: Transaction[] = [];

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(10000); // Last ~10000 blocks

      // Fetch wrap/unwrap events from WETH contract
      const [depositLogs, withdrawalLogs] = await Promise.all([
        publicClient.getLogs({
          address: CONTRACTS.WETH,
          event: DEPOSIT_EVENT,
          args: { dst: address },
          fromBlock,
          toBlock: currentBlock,
        }).catch(() => []),
        publicClient.getLogs({
          address: CONTRACTS.WETH,
          event: WITHDRAWAL_EVENT,
          args: { src: address },
          fromBlock,
          toBlock: currentBlock,
        }).catch(() => []),
      ]);

      // Process deposit (wrap) events
      for (const log of depositLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        txs.push({
          hash: log.transactionHash,
          type: 'wrap',
          tokenIn: 'PHRS',
          tokenOut: 'WPHRS',
          amountIn: formatUnits(log.args.wad || BigInt(0), 18),
          amountOut: formatUnits(log.args.wad || BigInt(0), 18),
          status: 'success',
          timestamp: new Date(Number(block.timestamp) * 1000),
          blockNumber: log.blockNumber,
        });
      }

      // Process withdrawal (unwrap) events
      for (const log of withdrawalLogs) {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        txs.push({
          hash: log.transactionHash,
          type: 'unwrap',
          tokenIn: 'WPHRS',
          tokenOut: 'PHRS',
          amountIn: formatUnits(log.args.wad || BigInt(0), 18),
          amountOut: formatUnits(log.args.wad || BigInt(0), 18),
          status: 'success',
          timestamp: new Date(Number(block.timestamp) * 1000),
          blockNumber: log.blockNumber,
        });
      }

      // Sort by block number (most recent first)
      txs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [address, publicClient]);

  const handleRefresh = () => {
    fetchTransactions();
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

  // Stats
  const stats = {
    totalTxs: transactions.length,
    successTxs: transactions.filter(t => t.status === 'success').length,
    wraps: transactions.filter(t => t.type === 'wrap' || t.type === 'unwrap').length,
    swaps: transactions.filter(t => t.type === 'swap').length,
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
            <Card className="glass-card border-success/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success">{stats.successTxs}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.wraps}</p>
                <p className="text-sm text-muted-foreground">Wrap/Unwrap</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.swaps}</p>
                <p className="text-sm text-muted-foreground">Swaps</p>
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
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </div>
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
              Only your wallet's wrap/unwrap operations are currently tracked.
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default History;