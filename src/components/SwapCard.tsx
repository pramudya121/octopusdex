import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowDownUp, Settings, ChevronDown } from 'lucide-react';
import { Token, TOKEN_LIST } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { useAccount } from 'wagmi';
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

const SwapCard = () => {
  const { isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState<Token>(TOKEN_LIST[1]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKEN_LIST[3]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isTokenInSelectorOpen, setIsTokenInSelectorOpen] = useState(false);
  const [isTokenOutSelectorOpen, setIsTokenOutSelectorOpen] = useState(false);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
  };

  return (
    <Card className="glass-card p-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Swap</h2>
        <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
      </div>

      <div className="token-input mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You Pay</span>
        </div>
        <div className="flex items-center gap-3">
          <Input type="number" placeholder="0.0" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} className="flex-1 text-2xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0" />
          <Button variant="secondary" className="flex items-center gap-2 px-3" onClick={() => setIsTokenInSelectorOpen(true)}>
            <img src={getTokenLogo(tokenIn.symbol)} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
            {tokenIn.symbol}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative h-2 my-2">
        <button onClick={switchTokens} className="swap-arrow top-1/2"><ArrowDownUp className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div className="token-input mt-2">
        <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">You Receive</span></div>
        <div className="flex items-center gap-3">
          <Input type="number" placeholder="0.0" value={amountOut} readOnly className="flex-1 text-2xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0" />
          <Button variant="secondary" className="flex items-center gap-2 px-3" onClick={() => setIsTokenOutSelectorOpen(true)}>
            <img src={getTokenLogo(tokenOut.symbol)} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
            {tokenOut.symbol}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button variant="glow" size="lg" className="w-full mt-6" disabled={!isConnected || !amountIn}>
        {!isConnected ? 'Connect Wallet' : !amountIn ? 'Enter Amount' : 'Swap'}
      </Button>

      <TokenSelector isOpen={isTokenInSelectorOpen} onClose={() => setIsTokenInSelectorOpen(false)} onSelect={setTokenIn} selectedToken={tokenIn} disabledToken={tokenOut} />
      <TokenSelector isOpen={isTokenOutSelectorOpen} onClose={() => setIsTokenOutSelectorOpen(false)} onSelect={setTokenOut} selectedToken={tokenOut} disabledToken={tokenIn} />
    </Card>
  );
};

export default SwapCard;
