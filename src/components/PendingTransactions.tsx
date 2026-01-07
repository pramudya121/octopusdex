import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, CheckCircle2, XCircle, ExternalLink, 
  Loader2, Trash2, ArrowLeftRight, Droplets, RefreshCw
} from 'lucide-react';
import { PendingTransaction } from '@/hooks/usePendingTransactions';
import { PHAROS_TESTNET } from '@/config/contracts';

interface PendingTransactionsProps {
  transactions: PendingTransaction[];
  pendingCount: number;
  onClearCompleted: () => void;
}

const getTypeIcon = (type: PendingTransaction['type']) => {
  switch (type) {
    case 'swap':
      return <ArrowLeftRight className="w-4 h-4" />;
    case 'addLiquidity':
    case 'removeLiquidity':
      return <Droplets className="w-4 h-4" />;
    case 'wrap':
    case 'unwrap':
      return <RefreshCw className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getStatusIcon = (status: PendingTransaction['status']) => {
  switch (status) {
    case 'pending':
      return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    case 'confirmed':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const PendingTransactions = ({ 
  transactions, 
  pendingCount, 
  onClearCompleted 
}: PendingTransactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (transactions.length === 0) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative border-primary/30 hover:bg-primary/10"
        >
          {pendingCount > 0 ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Clock className="w-4 h-4 mr-2" />
          )}
          <span className="hidden sm:inline">
            {pendingCount > 0 ? `${pendingCount} Pending` : 'Recent'}
          </span>
          {pendingCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card border-primary/20" align="end">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <h4 className="font-semibold">Recent Transactions</h4>
          {transactions.some(tx => tx.status !== 'pending') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearCompleted}
              className="h-7 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {transactions.map((tx) => (
              <a
                key={tx.hash}
                href={`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-secondary/50">
                  {getTypeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(tx.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(tx.status)}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default PendingTransactions;
