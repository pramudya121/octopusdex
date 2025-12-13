import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TOKEN_LIST, Token } from '@/config/contracts';
import { Search } from 'lucide-react';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  disabledToken?: Token;
}

const getTokenLogo = (symbol: string): string => {
  switch (symbol) {
    case 'OCTO':
      return octoLogo;
    case 'BNB':
      return bnbLogo;
    case 'ETH':
      return ethLogo;
    case 'USDC':
      return usdcLogo;
    default:
      return octoLogo;
  }
};

const TokenSelector = ({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  disabledToken,
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<Token[]>(TOKEN_LIST);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredTokens(
      TOKEN_LIST.filter(
        (token) =>
          token.symbol.toLowerCase().includes(query) ||
          token.name.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Token</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        {/* Token List */}
        <div className="max-h-80 overflow-y-auto space-y-1 mt-4">
          {filteredTokens.map((token) => {
            const isSelected =
              selectedToken?.address.toLowerCase() === token.address.toLowerCase();
            const isDisabled =
              disabledToken?.address.toLowerCase() === token.address.toLowerCase();

            return (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary/20 border border-primary/50'
                    : isDisabled
                    ? 'opacity-50 cursor-not-allowed bg-secondary/30'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <img
                  src={getTokenLogo(token.symbol)}
                  alt={token.symbol}
                  className="w-10 h-10 rounded-full object-cover bg-background"
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{token.symbol}</p>
                  <p className="text-xs text-muted-foreground">{token.name}</p>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
