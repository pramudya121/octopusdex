import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowDown, AlertTriangle, Zap, ArrowRight, 
  CheckCircle2, Loader2, ExternalLink, Shield
} from 'lucide-react';
import { Token, PHAROS_TESTNET } from '@/config/contracts';
import { SwapRoute } from '@/hooks/useMultiHopSwap';
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

interface SwapConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  route: SwapRoute | null;
  slippage: number;
  priceImpact: number;
  priceImpactSeverity: 'low' | 'medium' | 'high' | 'critical';
  isLoading: boolean;
}

const SwapConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  tokenIn,
  tokenOut,
  amountIn,
  route,
  slippage,
  priceImpact,
  priceImpactSeverity,
  isLoading,
}: SwapConfirmModalProps) => {
  if (!route) return null;

  const minReceived = parseFloat(route.amountOutFormatted) * (1 - slippage / 100);
  const rate = parseFloat(route.amountOutFormatted) / parseFloat(amountIn);

  const getPriceImpactColor = () => {
    switch (priceImpactSeverity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-warning';
      default: return 'text-success';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Confirm Swap
          </DialogTitle>
          <DialogDescription>
            Review your swap details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Exchange Display */}
          <div className="p-4 rounded-xl bg-secondary/30 space-y-3">
            {/* From */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <div className="flex items-center gap-2">
                <img src={getTokenLogo(tokenIn.symbol)} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
                <span className="text-xl font-bold">{parseFloat(amountIn).toFixed(6)}</span>
                <span className="text-muted-foreground">{tokenIn.symbol}</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-primary/20">
                <ArrowDown className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* To */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <div className="flex items-center gap-2">
                <img src={getTokenLogo(tokenOut.symbol)} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
                <span className="text-xl font-bold text-primary">{parseFloat(route.amountOutFormatted).toFixed(6)}</span>
                <span className="text-muted-foreground">{tokenOut.symbol}</span>
              </div>
            </div>
          </div>

          {/* Route Info */}
          {route.isMultiHop && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Best Route:</span>
                <div className="flex items-center gap-1">
                  {route.pathSymbols.map((symbol, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">{symbol}</Badge>
                      {i < route.pathSymbols.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Price Impact Warning */}
          {priceImpact >= 3 && (
            <Alert className={`${
              priceImpactSeverity === 'critical' 
                ? 'border-destructive/50 bg-destructive/10' 
                : 'border-orange-500/50 bg-orange-500/10'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${priceImpactSeverity === 'critical' ? 'text-destructive' : 'text-orange-500'}`} />
              <AlertDescription className={`text-sm ${priceImpactSeverity === 'critical' ? 'text-destructive' : 'text-orange-500'}`}>
                {priceImpactSeverity === 'critical' 
                  ? 'Extremely high price impact! You may lose a significant portion of your funds.'
                  : 'High price impact. Consider reducing the swap amount.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Swap Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Rate</span>
              <span>1 {tokenIn.symbol} = {rate.toFixed(6)} {tokenOut.symbol}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={getPriceImpactColor()}>
                {priceImpact < 0.01 ? '<0.01%' : `-${priceImpact.toFixed(2)}%`}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span>{slippage}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Minimum Received</span>
              <span className="font-medium">{minReceived.toFixed(6)} {tokenOut.symbol}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              variant="glow" 
              onClick={onConfirm} 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Swap
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground">
            Output is estimated. You will receive at least {minReceived.toFixed(6)} {tokenOut.symbol} or the transaction will revert.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmModal;
