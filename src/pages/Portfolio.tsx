import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Wallet, Droplets, Clock, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { TOKEN_LIST, CONTRACTS } from '@/config/contracts';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import phrsLogo from '@/assets/tokens/octo.png';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'PHRS': return phrsLogo;
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
    <div className="flex items-center gap-3 p-4 hover:bg-secondary/30 rounded-xl transition-colors">
      <img src={getTokenLogo(token.symbol)} alt={token.symbol} className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <p className="font-semibold">{token.symbol}</p>
        <p className="text-sm text-muted-foreground">{token.name}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{isLoading ? '...' : balance.toFixed(4)}</p>
      </div>
    </div>
  );
};

// LP Position Component
const LPPosition = ({ tokenA, tokenB }: { tokenA: typeof TOKEN_LIST[0], tokenB: typeof TOKEN_LIST[0] }) => {
  const { useGetPair, useGetLPBalance, useGetReserves } = useLiquidity();
  const pairAddress = useGetPair(tokenA, tokenB);
  const { balance: lpBalance } = useGetLPBalance(pairAddress);
  const { reserve0, reserve1 } = useGetReserves(pairAddress);
  
  if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') return null;
  if (lpBalance <= BigInt(0)) return null;
  
  return (
    <div className="p-4 bg-secondary/30 rounded-xl mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex -space-x-2">
          <img src={getTokenLogo(tokenA.symbol)} alt={tokenA.symbol} className="w-8 h-8 rounded-full border-2 border-background" />
          <img src={getTokenLogo(tokenB.symbol)} alt={tokenB.symbol} className="w-8 h-8 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{tokenA.symbol}/{tokenB.symbol}</p>
          <p className="text-xs text-muted-foreground font-mono">{pairAddress.slice(0, 10)}...</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">LP Tokens</p>
          <p className="font-medium">{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pool Share</p>
          <p className="font-medium">
            {reserve0 > BigInt(0) ? '< 0.01%' : '100%'}
          </p>
        </div>
      </div>
    </div>
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
            <Card className="glass-card p-12 text-center">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">Connect your wallet to view your portfolio</p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Portfolio - OCTOPUS DEX</title></Helmet>
      <WaveBackground />
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
              <Button variant="ghost" size="icon" onClick={copyAddress}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
              <a href={`https://pharos-atlantic-testnet.socialscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            </div>
          </div>

          <Card className="glass-card p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-1">Native Balance (PHRS)</p>
            <p className="text-4xl font-bold text-gradient">
              {nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4) : '0.0000'}
            </p>
          </Card>

          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="tokens"><Wallet className="w-4 h-4 mr-2" /> Tokens</TabsTrigger>
              <TabsTrigger value="positions"><Droplets className="w-4 h-4 mr-2" /> Positions</TabsTrigger>
              <TabsTrigger value="history"><Clock className="w-4 h-4 mr-2" /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="tokens">
              <Card className="glass-card p-4">
                {/* Native Token */}
                <div className="flex items-center gap-3 p-4 hover:bg-secondary/30 rounded-xl transition-colors">
                  <img src={phrsLogo} alt="PHRS" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-semibold">PHRS</p>
                    <p className="text-sm text-muted-foreground">Pharos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4) : '0.0000'}
                    </p>
                  </div>
                </div>
                
                {/* ERC20 Tokens */}
                {TOKEN_LIST.filter(t => !t.isNative).map((token) => (
                  <TokenRow key={token.address} token={token} />
                ))}
              </Card>
            </TabsContent>

            <TabsContent value="positions">
              <Card className="glass-card p-6">
                {tokenPairs.map(([tokenA, tokenB], index) => (
                  <LPPosition key={index} tokenA={tokenA} tokenB={tokenB} />
                ))}
                
                <div className="text-center py-6">
                  <Link to="/liquidity">
                    <Button variant="glow">Add New Position</Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="glass-card p-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Transaction History</h3>
                <p className="text-muted-foreground mb-4">View your transactions on the block explorer</p>
                <a href={`https://pharos-atlantic-testnet.socialscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
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
