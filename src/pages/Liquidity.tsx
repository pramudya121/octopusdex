import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Token, TOKEN_LIST, CONTRACTS } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
import { Helmet } from 'react-helmet-async';
import { useLiquidity } from '@/hooks/useLiquidity';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { quote, calculateLiquidityMinted, formatBalance } from '@/lib/uniswapV2Library';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
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

const Liquidity = () => {
  const { isConnected, address } = useAccount();
  const [tokenA, setTokenA] = useState<Token>(TOKEN_LIST[0]); // PHRS
  const [tokenB, setTokenB] = useState<Token>(TOKEN_LIST[1]); // OCTO
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [isTokenASelectorOpen, setIsTokenASelectorOpen] = useState(false);
  const [isTokenBSelectorOpen, setIsTokenBSelectorOpen] = useState(false);

  const { addLiquidity, approve, useGetPair, useGetReserves, useGetLPBalance, isLoading } = useLiquidity();
  const { formatted: balanceA } = useTokenBalance(tokenA);
  const { formatted: balanceB } = useTokenBalance(tokenB);
  
  const pairAddress = useGetPair(tokenA, tokenB);
  const { reserve0, reserve1 } = useGetReserves(pairAddress);
  const { balance: lpBalance } = useGetLPBalance(pairAddress);

  const isPairExists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
  const hasReserves = reserve0 > BigInt(0) && reserve1 > BigInt(0);

  // Calculate amountB based on amountA and reserves
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (hasReserves && value && parseFloat(value) > 0) {
      const amountAParsed = parseUnits(value, tokenA.decimals);
      // Determine which reserve corresponds to tokenA
      const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
      const tokenBAddress = tokenB.isNative ? CONTRACTS.WETH : tokenB.address;
      const isTokenAFirst = tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase();
      const reserveA = isTokenAFirst ? reserve0 : reserve1;
      const reserveB = isTokenAFirst ? reserve1 : reserve0;
      
      const quotedB = quote(amountAParsed, reserveA, reserveB);
      setAmountB(formatUnits(quotedB, tokenB.decimals));
    }
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (hasReserves && value && parseFloat(value) > 0) {
      const amountBParsed = parseUnits(value, tokenB.decimals);
      const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
      const tokenBAddress = tokenB.isNative ? CONTRACTS.WETH : tokenB.address;
      const isTokenAFirst = tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase();
      const reserveA = isTokenAFirst ? reserve0 : reserve1;
      const reserveB = isTokenAFirst ? reserve1 : reserve0;
      
      const quotedA = quote(amountBParsed, reserveB, reserveA);
      setAmountA(formatUnits(quotedA, tokenA.decimals));
    }
  };

  const handleApproveA = async () => {
    if (tokenA.isNative) return;
    await approve(tokenA);
  };

  const handleApproveB = async () => {
    if (tokenB.isNative) return;
    await approve(tokenB);
  };

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB) return;
    try {
      await addLiquidity(tokenA, tokenB, amountA, amountB);
      setAmountA('');
      setAmountB('');
      toast.success('Liquidity added successfully!');
    } catch (error) {
      console.error('Add liquidity failed:', error);
    }
  };

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
                {/* Token A */}
                <div className="token-input mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Token A</span>
                    <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceA).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amountA}
                      onChange={(e) => handleAmountAChange(e.target.value)}
                      className="flex-1 text-xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    />
                    <Button variant="secondary" onClick={() => setIsTokenASelectorOpen(true)}>
                      <img src={getTokenLogo(tokenA.symbol)} alt={tokenA.symbol} className="w-6 h-6 rounded-full" />
                      {tokenA.symbol}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center my-2">
                  <div className="bg-secondary rounded-xl p-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Token B */}
                <div className="token-input mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Token B</span>
                    <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceB).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amountB}
                      onChange={(e) => handleAmountBChange(e.target.value)}
                      className="flex-1 text-xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    />
                    <Button variant="secondary" onClick={() => setIsTokenBSelectorOpen(true)}>
                      <img src={getTokenLogo(tokenB.symbol)} alt={tokenB.symbol} className="w-6 h-6 rounded-full" />
                      {tokenB.symbol}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Pool Info */}
                {isPairExists && (
                  <div className="p-3 bg-secondary/30 rounded-xl mb-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool</span>
                      <span>{tokenA.symbol}/{tokenB.symbol}</span>
                    </div>
                    {hasReserves && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reserve {tokenA.symbol}</span>
                          <span>{parseFloat(formatUnits(reserve0, tokenA.decimals)).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reserve {tokenB.symbol}</span>
                          <span>{parseFloat(formatUnits(reserve1, tokenB.decimals)).toFixed(4)}</span>
                        </div>
                      </>
                    )}
                    {lpBalance > BigInt(0) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your LP Tokens</span>
                        <span>{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                )}

                {!isPairExists && amountA && amountB && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl mb-4 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Creating New Pool</p>
                      <p className="text-xs text-muted-foreground">You are the first to add liquidity. The ratio you provide will set the initial price.</p>
                    </div>
                  </div>
                )}

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  disabled={!isConnected || !amountA || !amountB || isLoading}
                  onClick={handleAddLiquidity}
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {!isConnected ? 'Connect Wallet' : isLoading ? 'Adding...' : 'Add Liquidity'}
                </Button>
              </TabsContent>

              <TabsContent value="remove">
                {lpBalance > BigInt(0) ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">Your LP Position</p>
                      <p className="text-2xl font-bold">{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}</p>
                      <p className="text-sm text-muted-foreground">{tokenA.symbol}/{tokenB.symbol} LP</p>
                    </div>
                    <Button variant="outline" size="lg" className="w-full" disabled>
                      Remove Liquidity (Coming Soon)
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>You don't have any liquidity positions in this pool</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>

          <TokenSelector
            isOpen={isTokenASelectorOpen}
            onClose={() => setIsTokenASelectorOpen(false)}
            onSelect={setTokenA}
            selectedToken={tokenA}
            disabledToken={tokenB}
          />
          <TokenSelector
            isOpen={isTokenBSelectorOpen}
            onClose={() => setIsTokenBSelectorOpen(false)}
            onSelect={setTokenB}
            selectedToken={tokenB}
            disabledToken={tokenA}
          />
        </div>
      </main>
    </>
  );
};

export default Liquidity;
