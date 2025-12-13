import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Plus, Minus, ChevronDown, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Token, TOKEN_LIST, CONTRACTS, getTokenByAddress } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
import { Helmet } from 'react-helmet-async';
import { useLiquidity } from '@/hooks/useLiquidity';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { quote, calculateRemoveLiquidityAmounts } from '@/lib/uniswapV2Library';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';
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

const Liquidity = () => {
  const { isConnected, address } = useAccount();
  const [tokenA, setTokenA] = useState<Token>(TOKEN_LIST[0]);
  const [tokenB, setTokenB] = useState<Token>(TOKEN_LIST[1]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState(25);
  const [isTokenASelectorOpen, setIsTokenASelectorOpen] = useState(false);
  const [isTokenBSelectorOpen, setIsTokenBSelectorOpen] = useState(false);

  const { 
    addLiquidity, removeLiquidity, approve, approveLPToken,
    useGetPair, useGetReserves, useGetLPBalance, useGetTotalSupply, useGetLPAllowance, useGetPairTokens,
    useGetTokenAllowance,
    isLoading 
  } = useLiquidity();
  
  const { formatted: balanceA } = useTokenBalance(tokenA);
  const { formatted: balanceB } = useTokenBalance(tokenB);
  
  const pairAddress = useGetPair(tokenA, tokenB);
  const { reserve0, reserve1 } = useGetReserves(pairAddress);
  const { balance: lpBalance, refetch: refetchLPBalance } = useGetLPBalance(pairAddress);
  const totalSupply = useGetTotalSupply(pairAddress);
  const { allowance: lpAllowance, refetch: refetchLPAllowance } = useGetLPAllowance(pairAddress);
  const { token0: pairToken0, token1: pairToken1 } = useGetPairTokens(pairAddress);
  
  // Token allowances for add liquidity
  const { allowance: allowanceA, refetch: refetchAllowanceA } = useGetTokenAllowance(tokenA);
  const { allowance: allowanceB, refetch: refetchAllowanceB } = useGetTokenAllowance(tokenB);

  const isPairExists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
  const hasReserves = reserve0 > BigInt(0) && reserve1 > BigInt(0);

  // Calculate LP amount to remove
  const lpAmountToRemove = lpBalance * BigInt(removePercent) / BigInt(100);
  const needsLPApproval = lpAmountToRemove > BigInt(0) && lpAllowance < lpAmountToRemove;
  
  // Calculate token allowance needs for add liquidity
  const amountAParsed = amountA && parseFloat(amountA) > 0 ? parseUnits(amountA, tokenA.decimals) : BigInt(0);
  const amountBParsed = amountB && parseFloat(amountB) > 0 ? parseUnits(amountB, tokenB.decimals) : BigInt(0);
  const needsApprovalA = !tokenA.isNative && amountAParsed > BigInt(0) && allowanceA < amountAParsed;
  const needsApprovalB = !tokenB.isNative && amountBParsed > BigInt(0) && allowanceB < amountBParsed;

  // Calculate expected output amounts
  const getExpectedAmounts = () => {
    if (!hasReserves || totalSupply === BigInt(0) || lpAmountToRemove === BigInt(0)) {
      return { amountA: BigInt(0), amountB: BigInt(0) };
    }
    
    const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
    const isTokenAToken0 = pairToken0?.toLowerCase() === tokenAAddress.toLowerCase();
    
    const reserveA = isTokenAToken0 ? reserve0 : reserve1;
    const reserveB = isTokenAToken0 ? reserve1 : reserve0;
    
    return calculateRemoveLiquidityAmounts(lpAmountToRemove, reserveA, reserveB, totalSupply);
  };

  const { amountA: expectedAmountA, amountB: expectedAmountB } = getExpectedAmounts();

  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (hasReserves && value && parseFloat(value) > 0) {
      const amountAParsed = parseUnits(value, tokenA.decimals);
      const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
      const isTokenAToken0 = pairToken0?.toLowerCase() === tokenAAddress.toLowerCase();
      const reserveA = isTokenAToken0 ? reserve0 : reserve1;
      const reserveB = isTokenAToken0 ? reserve1 : reserve0;
      
      const quotedB = quote(amountAParsed, reserveA, reserveB);
      setAmountB(formatUnits(quotedB, tokenB.decimals));
    } else if (!value) {
      setAmountB('');
    }
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (hasReserves && value && parseFloat(value) > 0) {
      const amountBParsed = parseUnits(value, tokenB.decimals);
      const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
      const isTokenAToken0 = pairToken0?.toLowerCase() === tokenAAddress.toLowerCase();
      const reserveA = isTokenAToken0 ? reserve0 : reserve1;
      const reserveB = isTokenAToken0 ? reserve1 : reserve0;
      
      const quotedA = quote(amountBParsed, reserveB, reserveA);
      setAmountA(formatUnits(quotedA, tokenA.decimals));
    } else if (!value) {
      setAmountA('');
    }
  };

  const handleApproveTokenA = async () => {
    try {
      await approve(tokenA);
      refetchAllowanceA();
    } catch (error) {
      console.error('Approve token A failed:', error);
    }
  };

  const handleApproveTokenB = async () => {
    try {
      await approve(tokenB);
      refetchAllowanceB();
    } catch (error) {
      console.error('Approve token B failed:', error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB) return;
    try {
      await addLiquidity(tokenA, tokenB, amountA, amountB);
      setAmountA('');
      setAmountB('');
      refetchLPBalance();
      refetchAllowanceA();
      refetchAllowanceB();
      toast.success('Liquidity added successfully!');
    } catch (error) {
      console.error('Add liquidity failed:', error);
    }
  };

  const handleApproveLPToken = async () => {
    if (!pairAddress) return;
    try {
      await approveLPToken(pairAddress);
      refetchLPAllowance();
    } catch (error) {
      console.error('Approve LP token failed:', error);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!pairAddress || lpAmountToRemove === BigInt(0)) return;
    
    // Apply slippage (0.5%)
    const amountAMin = expectedAmountA * BigInt(995) / BigInt(1000);
    const amountBMin = expectedAmountB * BigInt(995) / BigInt(1000);
    
    try {
      await removeLiquidity(tokenA, tokenB, lpAmountToRemove, amountAMin, amountBMin);
      setRemovePercent(25);
      refetchLPBalance();
      toast.success('Liquidity removed successfully!');
    } catch (error) {
      console.error('Remove liquidity failed:', error);
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
            <p className="text-muted-foreground">Add or remove liquidity to earn trading fees</p>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceA).toFixed(4)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAmountAChange(balanceA)}
                        className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                      >
                        MAX
                      </Button>
                    </div>
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
                  <div className="bg-secondary rounded-xl p-2"><Plus className="w-4 h-4 text-muted-foreground" /></div>
                </div>

                {/* Token B */}
                <div className="token-input mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Token B</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceB).toFixed(4)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAmountBChange(balanceB)}
                        className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                      >
                        MAX
                      </Button>
                    </div>
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
                {isPairExists && hasReserves && (
                  <div className="p-3 bg-secondary/30 rounded-xl mb-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool</span>
                      <span>{tokenA.symbol}/{tokenB.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool Rate</span>
                      <span>1 {tokenA.symbol} = {hasReserves ? (Number(reserve1) / Number(reserve0)).toFixed(6) : '0'} {tokenB.symbol}</span>
                    </div>
                    {lpBalance > BigInt(0) && (
                      <div className="flex justify-between text-primary">
                        <span>Your LP Tokens</span>
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

                {/* Approval and Add Liquidity Buttons */}
                <div className="space-y-3">
                  {needsApprovalA && (
                    <Button
                      variant="outline" size="lg" className="w-full border-primary/50 hover:bg-primary/10"
                      disabled={!isConnected || !amountA || isLoading}
                      onClick={handleApproveTokenA}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Approve {tokenA.symbol}
                    </Button>
                  )}
                  {needsApprovalB && !needsApprovalA && (
                    <Button
                      variant="outline" size="lg" className="w-full border-primary/50 hover:bg-primary/10"
                      disabled={!isConnected || !amountB || isLoading}
                      onClick={handleApproveTokenB}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Approve {tokenB.symbol}
                    </Button>
                  )}
                  {!needsApprovalA && !needsApprovalB && (
                    <Button
                      variant="glow" size="lg" className="w-full"
                      disabled={!isConnected || !amountA || !amountB || isLoading}
                      onClick={handleAddLiquidity}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {!isConnected ? 'Connect Wallet' : isLoading ? 'Adding...' : 'Add Liquidity'}
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="remove">
                {lpBalance > BigInt(0) ? (
                  <div className="space-y-6">
                    {/* LP Position Info */}
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <img src={getTokenLogo(tokenA.symbol)} className="w-8 h-8 rounded-full border-2 border-background" alt={tokenA.symbol} />
                            <img src={getTokenLogo(tokenB.symbol)} className="w-8 h-8 rounded-full border-2 border-background" alt={tokenB.symbol} />
                          </div>
                          <span className="font-semibold">{tokenA.symbol}/{tokenB.symbol}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Your Position</p>
                          <p className="font-bold">{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)} LP</p>
                        </div>
                      </div>
                    </div>

                    {/* Remove Amount Slider */}
                    <div>
                      <div className="flex justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Amount to Remove</span>
                        <span className="text-2xl font-bold text-primary">{removePercent}%</span>
                      </div>
                      <Slider
                        value={[removePercent]}
                        onValueChange={([value]) => setRemovePercent(value)}
                        max={100}
                        step={1}
                        className="mb-4"
                      />
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map((percent) => (
                          <Button
                            key={percent}
                            variant={removePercent === percent ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setRemovePercent(percent)}
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Preview Output */}
                    {removePercent > 0 && (
                      <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">You will receive</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={getTokenLogo(tokenA.symbol)} className="w-6 h-6 rounded-full" alt={tokenA.symbol} />
                            <span>{tokenA.symbol}</span>
                          </div>
                          <span className="font-semibold">{parseFloat(formatUnits(expectedAmountA, tokenA.decimals)).toFixed(6)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={getTokenLogo(tokenB.symbol)} className="w-6 h-6 rounded-full" alt={tokenB.symbol} />
                            <span>{tokenB.symbol}</span>
                          </div>
                          <span className="font-semibold">{parseFloat(formatUnits(expectedAmountB, tokenB.decimals)).toFixed(6)}</span>
                        </div>
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">LP Tokens to Burn</span>
                            <span>{parseFloat(formatUnits(lpAmountToRemove, 18)).toFixed(6)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {needsLPApproval ? (
                      <Button variant="glow" size="lg" className="w-full" onClick={handleApproveLPToken} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Approve LP Tokens
                      </Button>
                    ) : (
                      <Button
                        variant="glow" size="lg" className="w-full"
                        disabled={!isConnected || removePercent === 0 || isLoading}
                        onClick={handleRemoveLiquidity}
                      >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isLoading ? 'Removing...' : 'Remove Liquidity'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Minus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No liquidity position found</p>
                    <p className="text-sm text-muted-foreground">Select a pair with existing liquidity to remove</p>
                  </div>
                )}
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
