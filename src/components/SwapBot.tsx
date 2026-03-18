import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bot, Zap, RotateCcw, Activity, Hash, Clock } from 'lucide-react';

interface SwapBotProps {
  onRandomize: () => void;
  onAutoSwap: () => void;
  isConnected: boolean;
  onMinAmountChange: (val: number) => void;
  onMaxAmountChange: (val: number) => void;
}

const SwapBot = ({ onRandomize, onAutoSwap, isConnected, onMinAmountChange = () => {}, onMaxAmountChange = () => {} }: SwapBotProps) => {
  const [botEnabled, setBotEnabled] = useState(false);
  const [autoClick, setAutoClick] = useState(false);
  const [interval, setInterval_] = useState(3);
  const [minAmount, setMinAmount] = useState('0.001');
  const [maxAmount, setMaxAmount] = useState('0.01');
  const [txCount, setTxCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync min/max to parent
  useEffect(() => {
    onMinAmountChange(parseFloat(minAmount) || 0.001);
  }, [minAmount, onMinAmountChange]);

  useEffect(() => {
    onMaxAmountChange(parseFloat(maxAmount) || 0.01);
  }, [maxAmount, onMaxAmountChange]);

  const doSwap = useCallback(() => {
    onRandomize();
    onAutoSwap();
    setTxCount(prev => prev + 1);
  }, [onRandomize, onAutoSwap]);

  // Auto-click interval
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

  // Session timer
  useEffect(() => {
    if (botEnabled && autoClick) {
      if (!sessionStart) setSessionStart(new Date());
      timerRef.current = globalThis.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [botEnabled, autoClick]);

  const resetStats = () => {
    setTxCount(0);
    setElapsed(0);
    setSessionStart(null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="glass-card p-4 w-full max-w-md mx-auto mt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className={`w-5 h-5 ${botEnabled ? 'text-success animate-pulse' : 'text-primary'}`} />
          <h3 className="font-bold">Bot Swap</h3>
          {botEnabled && autoClick && (
            <span className="flex items-center gap-1 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
              <Activity className="w-3 h-3" /> LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{botEnabled ? 'ON' : 'OFF'}</span>
          <Switch checked={botEnabled} onCheckedChange={(v) => {
            setBotEnabled(v);
            if (!v) { setAutoClick(false); }
          }} />
        </div>
      </div>

      {botEnabled && (
        <div className="space-y-3">
          {/* Stats Bar */}
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg text-xs">
            <div className="flex items-center gap-1 text-primary">
              <Hash className="w-3 h-3" />
              <span className="font-semibold">{txCount}</span>
              <span className="text-muted-foreground">tx</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(elapsed)}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={resetStats}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>

          {/* Min/Max Amount */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Min Amount</label>
              <Input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-8 text-sm"
                step="0.001"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max Amount</label>
              <Input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-8 text-sm"
                step="0.001"
              />
            </div>
          </div>

          {/* Manual Swap Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              onRandomize();
              setTxCount(prev => prev + 1);
              onAutoSwap();
            }}
            disabled={!isConnected}
          >
            <Zap className="w-4 h-4 mr-1" /> Tukar (Acak Nominal)
          </Button>

          {/* Auto Click */}
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
            <p className="text-xs text-success animate-pulse text-center font-medium">
              ⚡ Auto-swap aktif — interval {interval}s — {txCount} transaksi
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
