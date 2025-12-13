import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Wallet, Droplets, Clock, ExternalLink, Copy, Check } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { TOKEN_LIST } from '@/config/contracts';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { Helmet } from 'react-helmet-async';
import octoLogo from '@/assets/tokens/octo.png';

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
              <Button variant="ghost" size="icon" onClick={copyAddress}>{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}</Button>
              <a href={`https://pharos-atlantic-testnet.socialscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            </div>
          </div>

          <Card className="glass-card p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-1">Native Balance (PHRS)</p>
            <p className="text-4xl font-bold text-gradient">{nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4) : '0.0000'}</p>
          </Card>

          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="tokens"><Wallet className="w-4 h-4 mr-2" /> Tokens</TabsTrigger>
              <TabsTrigger value="positions"><Droplets className="w-4 h-4 mr-2" /> Positions</TabsTrigger>
              <TabsTrigger value="history"><Clock className="w-4 h-4 mr-2" /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="tokens">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 p-4 hover:bg-secondary/30 rounded-xl">
                  <img src={octoLogo} alt="PHRS" className="w-10 h-10 rounded-full" />
                  <div className="flex-1"><p className="font-semibold">PHRS</p><p className="text-sm text-muted-foreground">Pharos</p></div>
                  <p className="font-semibold">{nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4) : '0.0000'}</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="positions">
              <Card className="glass-card p-12 text-center">
                <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Liquidity Positions</h3>
                <Link to="/liquidity"><Button variant="glow">Add Liquidity</Button></Link>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="glass-card p-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Transaction History</h3>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Portfolio;
