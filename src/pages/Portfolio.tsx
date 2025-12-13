import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { 
  Wallet, Droplets, Clock, ExternalLink, Copy, Check, 
  TrendingUp, Coins, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { TOKEN_LIST, CONTRACTS, PHAROS_TESTNET } from '@/config/contracts';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { Helmet } from 'react-helmet-async';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useLiquidity } from '@/hooks/useLiquidity';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';

const phrsLogo = '/tokens/phrs.png';

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

// Token Balance Row Component
const TokenRow = ({ token }: { token: typeof TOKEN_LIST[0] }) => {
  const { formatted, isLoading } = useTokenBalance(token);
  const balance = parseFloat(formatted);
  
  if (balance === 0 && !isLoading) return null;
  
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-secondary/30 rounded-xl transition-all duration-200 group">
      <div className="relative">
        <img src={getTokenLogo(token.symbol)} alt={token.symbol} className="w-12 h-12 rounded-full ring-2 ring-border" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-lg">{token.symbol}</p>
          <Badge variant="outline" className="text-xs">{token.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{token.address.slice(0, 10)}...{token.address.slice(-6)}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold">{isLoading ? '...' : balance.toFixed(4)}</p>
        <p className="text-sm text-muted-foreground">≈ $0.00</p>
      </div>
    </div>
  );
};

// LP Position Component
const LPPosition = ({ tokenA, tokenB }: { tokenA: typeof TOKEN_LIST[0], tokenB: typeof TOKEN_LIST[0] }) => {
  const { useGetPair, useGetLPBalance, useGetReserves, useGetTotalSupply } = useLiquidity();
  const pairAddress = useGetPair(tokenA, tokenB);
  const { balance: lpBalance } = useGetLPBalance(pairAddress);
  const { reserve0, reserve1 } = useGetReserves(pairAddress);
  const totalSupply = useGetTotalSupply(pairAddress);
  
  if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') return null;
  if (lpBalance <= BigInt(0)) return null;
  
  const poolShare = totalSupply > BigInt(0) 
    ? (Number(lpBalance) / Number(totalSupply) * 100).toFixed(2)
    : '0';

  return (
    <Card className="p-5 bg-gradient-to-br from-secondary/50 to-secondary/20 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <img src={getTokenLogo(tokenA.symbol)} alt={tokenA.symbol} className="w-10 h-10 rounded-full border-3 border-background ring-2 ring-primary/20" />
            <img src={getTokenLogo(tokenB.symbol)} alt={tokenB.symbol} className="w-10 h-10 rounded-full border-3 border-background ring-2 ring-primary/20" />
          </div>
          <div>
            <p className="font-bold text-lg">{tokenA.symbol}/{tokenB.symbol}</p>
            <Badge variant="secondary" className="text-xs">LP Position</Badge>
          </div>
        </div>
        <a 
          href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${pairAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">LP Tokens</p>
          <p className="font-bold text-primary">{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}</p>
        </div>
        <div className="p-3 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Pool Share</p>
          <p className="font-bold text-primary">{poolShare}%</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <Link to="/liquidity">
          <Button variant="outline" size="sm" className="w-full">
            Manage Position
          </Button>
        </Link>
      </div>
    </Card>
  );
};

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const { data: nativeBalance } = useBalance({ address });

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate all possible LP pairs
  const tokenPairs = [];
  for (let i = 0; i < TOKEN_LIST.length; i++) {
    for (let j = i + 1; j < TOKEN_LIST.length; j++) {
      tokenPairs.push([TOKEN_LIST[i], TOKEN_LIST[j]]);
    }
  }

  if (!isConnected) {
    return (
      <>
        <Helmet><title>Portfolio - OCTOPUS DEX</title></Helmet>
        <WaveBackground />
        <Header />
        <main className="min-h-screen pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="glass-card p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Connect your wallet to view your portfolio, token balances, and liquidity positions
              </p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const nativeBalanceFormatted = nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)) : 0;

  return (
    <>
      <Helmet><title>Portfolio - OCTOPUS DEX</title></Helmet>
      <WaveBackground />
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1 bg-secondary/50 rounded-lg text-sm font-mono">
                    {address?.slice(0, 10)}...{address?.slice(-8)}
                  </code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${address}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Native Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={phrsLogo} alt="PHRS" className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-3xl font-bold">{nativeBalanceFormatted.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">PHRS</p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <p className="text-3xl font-bold text-gradient">$0.00</p>
              <p className="text-sm text-muted-foreground">Estimated USD value</p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <PieChart className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-sm text-muted-foreground">LP Positions</span>
              </div>
              <p className="text-3xl font-bold">{tokenPairs.length}</p>
              <p className="text-sm text-muted-foreground">Available pools</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
              <TabsTrigger value="tokens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Coins className="w-4 h-4 mr-2" /> Tokens
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Droplets className="w-4 h-4 mr-2" /> Positions
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tokens">
              <Card className="glass-card overflow-hidden">
                {/* Native Token */}
                <div className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-all duration-200 border-b border-border/50">
                  <div className="relative">
                    <img src={phrsLogo} alt="PHRS" className="w-12 h-12 rounded-full ring-2 ring-primary" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">PHRS</p>
                      <Badge className="bg-primary/20 text-primary border-primary/50">Native</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Pharos Network Token</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{nativeBalanceFormatted.toFixed(4)}</p>
                    <p className="text-sm text-muted-foreground">≈ $0.00</p>
                  </div>
                </div>
                
                {/* ERC20 Tokens */}
                {TOKEN_LIST.filter(t => !t.isNative).map((token) => (
                  <div key={token.address} className="border-b border-border/50 last:border-b-0">
                    <TokenRow token={token} />
                  </div>
                ))}
              </Card>
            </TabsContent>

            <TabsContent value="positions">
              <div className="grid md:grid-cols-2 gap-4">
                {tokenPairs.map(([tokenA, tokenB], index) => (
                  <LPPosition key={index} tokenA={tokenA} tokenB={tokenB} />
                ))}
              </div>
              
              <Card className="glass-card p-8 text-center mt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Add Liquidity</h3>
                <p className="text-muted-foreground mb-4">Provide liquidity to earn trading fees</p>
                <Link to="/liquidity">
                  <Button variant="glow" size="lg">
                    Add New Position
                  </Button>
                </Link>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Transaction History</h3>
                <p className="text-muted-foreground mb-6">View your transactions on the block explorer</p>
                <a href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${address}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                </a>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Portfolio;