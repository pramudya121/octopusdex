import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import { Token, TOKEN_LIST } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
import { Helmet } from 'react-helmet-async';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'OCTO': return octoLogo;
    case 'BNB': return bnbLogo;
    case 'ETH': return ethLogo;
    case 'USDC': return usdcLogo;
    default: return octoLogo;
  }
};

const Liquidity = () => {
  const { isConnected } = useAccount();
  const [tokenA, setTokenA] = useState<Token>(TOKEN_LIST[1]);
  const [tokenB, setTokenB] = useState<Token>(TOKEN_LIST[4]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [isTokenASelectorOpen, setIsTokenASelectorOpen] = useState(false);
  const [isTokenBSelectorOpen, setIsTokenBSelectorOpen] = useState(false);

  return (
    <>
      <Helmet><title>Liquidity - OCTOPUS DEX</title></Helmet>
      <WaveBackground />
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-lg">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Liquidity</h1>
            <p className="text-muted-foreground">Add liquidity to earn trading fees</p>
          </div>

          <Card className="glass-card p-6 animate-fade-in">
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="add"><Plus className="w-4 h-4 mr-2" /> Add</TabsTrigger>
                <TabsTrigger value="remove"><Minus className="w-4 h-4 mr-2" /> Remove</TabsTrigger>
              </TabsList>

              <TabsContent value="add">
                <div className="token-input mb-4">
                  <span className="text-sm text-muted-foreground">Token A</span>
                  <div className="flex items-center gap-3 mt-2">
                    <Input type="number" placeholder="0.0" value={amountA} onChange={(e) => setAmountA(e.target.value)} className="flex-1 text-xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0" />
                    <Button variant="secondary" onClick={() => setIsTokenASelectorOpen(true)}>
                      <img src={getTokenLogo(tokenA.symbol)} alt={tokenA.symbol} className="w-6 h-6 rounded-full" />{tokenA.symbol}<ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center my-2"><div className="bg-secondary rounded-xl p-2"><Plus className="w-4 h-4 text-muted-foreground" /></div></div>

                <div className="token-input mb-4">
                  <span className="text-sm text-muted-foreground">Token B</span>
                  <div className="flex items-center gap-3 mt-2">
                    <Input type="number" placeholder="0.0" value={amountB} onChange={(e) => setAmountB(e.target.value)} className="flex-1 text-xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0" />
                    <Button variant="secondary" onClick={() => setIsTokenBSelectorOpen(true)}>
                      <img src={getTokenLogo(tokenB.symbol)} alt={tokenB.symbol} className="w-6 h-6 rounded-full" />{tokenB.symbol}<ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <Button variant="glow" size="lg" className="w-full" disabled={!isConnected || !amountA || !amountB}>
                  {!isConnected ? 'Connect Wallet' : 'Add Liquidity'}
                </Button>
              </TabsContent>

              <TabsContent value="remove">
                <div className="text-center py-12 text-muted-foreground"><p>Your positions will appear here</p></div>
              </TabsContent>
            </Tabs>
          </Card>

          <TokenSelector isOpen={isTokenASelectorOpen} onClose={() => setIsTokenASelectorOpen(false)} onSelect={setTokenA} selectedToken={tokenA} disabledToken={tokenB} />
          <TokenSelector isOpen={isTokenBSelectorOpen} onClose={() => setIsTokenBSelectorOpen(false)} onSelect={setTokenB} selectedToken={tokenB} disabledToken={tokenA} />
        </div>
      </main>
    </>
  );
};

export default Liquidity;
