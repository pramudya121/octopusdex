import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bot, Zap } from 'lucide-react';

interface SwapBotProps {
  onRandomize: () => void;
  onAutoSwap: () => void;
  isConnected: boolean;
}

const SwapBot = ({ onRandomize, onAutoSwap, isConnected }: SwapBotProps) => {
  const [botEnabled, setBotEnabled] = useState(false);
  const [autoClick, setAutoClick] = useState(false);
  const [interval, setInterval_] = useState(3);
  const [minAmount, setMinAmount] = useState('0.001');
  const [maxAmount, setMaxAmount] = useState('0.01');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSwap = useCallback(() => {
    onRandomize();
    onAutoSwap();
  }, [onRandomize, onAutoSwap]);

  useEffect(() => {
    if (autoClick && botEnabled && isConnected) {
      intervalRef.current = globalThis.setInterval(() => {
        doSwap();
      }, interval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoClick, botEnabled, isConnected, interval, doSwap]);

  return (
    <Card className="glass-card p-4 w-full max-w-md mx-auto mt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Bot Swap</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{botEnabled ? 'ON' : 'OFF'}</span>
          <Switch checked={botEnabled} onCheckedChange={setBotEnabled} />
        </div>
      </div>

      {botEnabled && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Min Amount</label>
              <Input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max Amount</label>
              <Input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onRandomize();
            }}
            disabled={!isConnected}
          >
            <Zap className="w-4 h-4 mr-1" /> Tukar (Acak Nominal)
          </Button>

          <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm">Klik Otomatis</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, parseFloat(e.target.value) || 3))}
                className="w-16 h-7 text-sm text-center"
                min={1}
              />
              <span className="text-xs text-muted-foreground">detik</span>
              <Switch checked={autoClick} onCheckedChange={setAutoClick} />
            </div>
          </div>

          {autoClick && (
            <p className="text-xs text-primary animate-pulse text-center">
              ⚡ Auto-swap aktif — interval {interval}s
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export { SwapBot };
export type { SwapBotProps };
export default SwapBot;
