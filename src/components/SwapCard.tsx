import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowDownUp, Settings, ChevronDown, Loader2, ArrowRight, Zap, AlertTriangle, AlertCircle } from 'lucide-react';
import { Token, TOKEN_LIST } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
import { useSwap } from '@/hooks/useSwap';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useBestRoute } from '@/hooks/useMultiHopSwap';
import { usePriceImpact } from '@/hooks/usePriceImpact';
import { parseUnits } from 'viem';
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

const SwapCard = () => {
  const { isConnected, address } = useAccount();
  const [tokenIn, setTokenIn] = useState<Token>(TOKEN_LIST[0]); // PHRS
  const [tokenOut, setTokenOut] = useState<Token>(TOKEN_LIST[1]); // OCTO
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isTokenInSelectorOpen, setIsTokenInSelectorOpen] = useState(false);
  const [isTokenOutSelectorOpen, setIsTokenOutSelectorOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { swapWithPath, approve, useCheckAllowance, isSwapping } = useSwap();
  const { formatted: balanceIn } = useTokenBalance(tokenIn);
  const { formatted: balanceOut } = useTokenBalance(tokenOut);
  
  // Multi-hop routing
  const amountInParsed = amountIn ? parseUnits(amountIn, tokenIn.decimals) : BigInt(0);
  const { bestRoute, allRoutes, isLoading: isQuoteLoading } = useBestRoute(amountInParsed, tokenIn, tokenOut);
  
  // Price impact calculation
  const { priceImpact, severity, warning: priceImpactWarning } = usePriceImpact(amountInParsed, tokenIn, tokenOut);
  
  const { allowance, refetch: refetchAllowance } = useCheckAllowance(tokenIn);
  const needsApproval = !tokenIn.isNative && amountInParsed > BigInt(0) && allowance < amountInParsed;

  const switchTokens = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(bestRoute?.amountOutFormatted || '');
  };

  const handleApprove = async () => {
    try {
      await approve(tokenIn);
      refetchAllowance();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleSwap = async () => {
    if (!amountIn || !bestRoute || bestRoute.amountOut <= BigInt(0)) return;
    
    try {
      await swapWithPath(bestRoute.path, tokenIn, tokenOut, amountIn, bestRoute.amountOut);
      setAmountIn('');
      toast.success(`Swapped ${amountIn} ${tokenIn.symbol} for ${bestRoute.amountOutFormatted} ${tokenOut.symbol}`);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const setMaxAmount = () => {
    // For native token, leave some for gas
    if (tokenIn.isNative) {
      const max = Math.max(0, parseFloat(balanceIn) - 0.01);
      setAmountIn(max.toString());
    } else {
      setAmountIn(balanceIn);
    }
  };

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!amountIn || parseFloat(amountIn) === 0) return 'Enter Amount';
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return 'Insufficient Balance';
    if (needsApproval) return `Approve ${tokenIn.symbol}`;
    if (isSwapping) return 'Swapping...';
    return 'Swap';
  };

  const isButtonDisabled = () => {
    if (!isConnected) return true;
    if (!amountIn || parseFloat(amountIn) === 0) return true;
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return true;
    if (isSwapping) return true;
    return false;
  };

  return (
    <Card className="glass-card p-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Swap</h2>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-secondary/30 rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">Slippage Tolerance</p>
          <div className="flex gap-2 flex-wrap">
            {[0.1, 0.5, 1.0].map((s) => (
              <Button
                key={s}
                variant={slippage === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSlippage(s)}
                className="min-w-[60px]"
              >
                {s}%
              </Button>
            ))}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                className="w-20 h-9 text-center"
                placeholder="Custom"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          {slippage > 5 && (
            <p className="text-xs text-destructive mt-2">High slippage may result in unfavorable rates</p>
          )}
        </div>
      )}

      {/* Token In */}
      <div className="token-input mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You Pay</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceIn).toFixed(4)}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={setMaxAmount}
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
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="flex-1 text-2xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
          />
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-3"
            onClick={() => setIsTokenInSelectorOpen(true)}
          >
            <img src={getTokenLogo(tokenIn.symbol)} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
            {tokenIn.symbol}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Switch Button */}
      <div className="relative h-2 my-2">
        <button onClick={switchTokens} className="swap-arrow top-1/2">
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Token Out */}
      <div className="token-input mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You Receive</span>
          <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceOut).toFixed(4)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center">
            {isQuoteLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-2xl font-semibold">
                {amountIn && bestRoute && parseFloat(bestRoute.amountOutFormatted) > 0 ? parseFloat(bestRoute.amountOutFormatted).toFixed(6) : '0.0'}
              </span>
            )}
          </div>
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-3"
            onClick={() => setIsTokenOutSelectorOpen(true)}
          >
            <img src={getTokenLogo(tokenOut.symbol)} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
            {tokenOut.symbol}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Price Impact Warning */}
      {amountIn && priceImpact >= 1 && (
        <Alert 
          className={`mt-4 ${
            severity === 'critical' 
              ? 'border-destructive/50 bg-destructive/10' 
              : severity === 'high' 
              ? 'border-orange-500/50 bg-orange-500/10' 
              : severity === 'medium'
              ? 'border-warning/50 bg-warning/10'
              : 'border-primary/50 bg-primary/10'
          }`}
        >
          {severity === 'critical' || severity === 'high' ? (
            <AlertTriangle className={`w-4 h-4 ${severity === 'critical' ? 'text-destructive' : 'text-orange-500'}`} />
          ) : (
            <AlertCircle className={`w-4 h-4 ${severity === 'medium' ? 'text-warning' : 'text-primary'}`} />
          )}
          <AlertDescription className={`text-sm ${
            severity === 'critical' 
              ? 'text-destructive' 
              : severity === 'high' 
              ? 'text-orange-500' 
              : severity === 'medium'
              ? 'text-warning'
              : 'text-primary'
          }`}>
            <div className="flex items-center justify-between">
              <span>{priceImpactWarning}</span>
              <span className="font-bold ml-2">-{priceImpact.toFixed(2)}%</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Swap Details */}
      {amountIn && bestRoute && parseFloat(bestRoute.amountOutFormatted) > 0 && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-xl text-sm space-y-2">
          {/* Route Display */}
          {bestRoute.isMultiHop && (
            <div className="flex items-center justify-between text-primary">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> Best Route
              </span>
              <div className="flex items-center gap-1">
                {bestRoute.pathSymbols.map((symbol, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {symbol}
                    {i < bestRoute.pathSymbols.length - 1 && <ArrowRight className="w-3 h-3" />}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>1 {tokenIn.symbol} = {(parseFloat(bestRoute.amountOutFormatted) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}</span>
          </div>
          {/* Price Impact in details */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={
              severity === 'critical' ? 'text-destructive font-bold' :
              severity === 'high' ? 'text-orange-500 font-semibold' :
              severity === 'medium' ? 'text-warning' :
              'text-success'
            }>
              {priceImpact < 0.01 ? '<0.01%' : `-${priceImpact.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min. Received</span>
            <span>{(parseFloat(bestRoute.amountOutFormatted) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span>{slippage}%</span>
          </div>
          {allRoutes.length > 1 && (
            <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
              <span>Routes compared</span>
              <span>{allRoutes.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <Button
        variant="glow"
        size="lg"
        className="w-full mt-6"
        disabled={isButtonDisabled()}
        onClick={needsApproval ? handleApprove : handleSwap}
      >
        {isSwapping && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {getButtonText()}
      </Button>

      <TokenSelector
        isOpen={isTokenInSelectorOpen}
        onClose={() => setIsTokenInSelectorOpen(false)}
        onSelect={setTokenIn}
        selectedToken={tokenIn}
        disabledToken={tokenOut}
      />
      <TokenSelector
        isOpen={isTokenOutSelectorOpen}
        onClose={() => setIsTokenOutSelectorOpen(false)}
        onSelect={setTokenOut}
        selectedToken={tokenOut}
        disabledToken={tokenIn}
      />
    </Card>
  );
};

export default SwapCard;
