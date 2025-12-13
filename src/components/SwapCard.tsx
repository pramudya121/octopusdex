import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, Settings, ChevronDown, Loader2, AlertTriangle } from 'lucide-react';
import { Token, TOKEN_LIST, CONTRACTS } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
import { useSwap } from '@/hooks/useSwap';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { calculatePriceImpact, calculateMinimumAmountOut } from '@/lib/uniswapV2Library';
import { parseUnits } from 'viem';
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

const SwapCard = () => {
  const { isConnected, address } = useAccount();
  const [tokenIn, setTokenIn] = useState<Token>(TOKEN_LIST[0]); // PHRS
  const [tokenOut, setTokenOut] = useState<Token>(TOKEN_LIST[1]); // OCTO
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isTokenInSelectorOpen, setIsTokenInSelectorOpen] = useState(false);
  const [isTokenOutSelectorOpen, setIsTokenOutSelectorOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { swap, approve, useGetAmountsOut, useCheckAllowance, isSwapping } = useSwap();
  const { amountOut, amountOutRaw, isLoading: isQuoteLoading } = useGetAmountsOut(amountIn, tokenIn, tokenOut);
  const { allowance, refetch: refetchAllowance } = useCheckAllowance(tokenIn);
  const { formatted: balanceIn } = useTokenBalance(tokenIn);
  const { formatted: balanceOut } = useTokenBalance(tokenOut);

  const amountInParsed = amountIn ? parseUnits(amountIn, tokenIn.decimals) : BigInt(0);
  const needsApproval = !tokenIn.isNative && amountInParsed > BigInt(0) && allowance < amountInParsed;

  const switchTokens = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
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
    if (!amountIn || amountOutRaw <= BigInt(0)) return;
    
    try {
      await swap(tokenIn, tokenOut, amountIn, amountOutRaw);
      setAmountIn('');
      toast.success(`Swapped ${amountIn} ${tokenIn.symbol} for ${amountOut} ${tokenOut.symbol}`);
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
          <p className="text-sm text-muted-foreground mb-2">Slippage Tolerance</p>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map((s) => (
              <Button
                key={s}
                variant={slippage === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSlippage(s)}
              >
                {s}%
              </Button>
            ))}
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
              className="w-20 h-9 text-center"
            />
          </div>
        </div>
      )}

      {/* Token In */}
      <div className="token-input mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You Pay</span>
          <button onClick={setMaxAmount} className="text-sm text-primary hover:underline">
            Balance: {parseFloat(balanceIn).toFixed(4)}
          </button>
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
                {amountIn && parseFloat(amountOut) > 0 ? parseFloat(amountOut).toFixed(6) : '0.0'}
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

      {/* Swap Details */}
      {amountIn && parseFloat(amountOut) > 0 && (
        <div className="mt-4 p-3 bg-secondary/30 rounded-xl text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min. Received</span>
            <span>{(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slippage</span>
            <span>{slippage}%</span>
          </div>
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
