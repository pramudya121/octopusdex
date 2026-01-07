import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TOKEN_LIST, Token } from '@/config/contracts';
import { Search, Plus, X, Trash2 } from 'lucide-react';
import { useCustomTokens, CustomToken } from '@/hooks/useCustomTokens';
import TokenImportModal from '@/components/TokenImportModal';
import octoLogo from '@/assets/tokens/octo.png';
import bnbLogo from '@/assets/tokens/bnb.png';
import ethLogo from '@/assets/tokens/eth.png';
import usdcLogo from '@/assets/tokens/usdc.png';
import { toast } from 'sonner';

const phrsLogo = '/tokens/phrs.png';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  disabledToken?: Token;
}

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

const TokenSelector = ({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  disabledToken,
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { customTokens, addToken, removeToken, isCustomToken } = useCustomTokens();

  // Combine default and custom tokens
  const allTokens = useMemo(() => {
    return [...TOKEN_LIST, ...customTokens];
  }, [customTokens]);

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return allTokens;
    return allTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    );
  }, [searchQuery, allTokens]);

  const existingAddresses = useMemo(() => {
    return allTokens.map(t => t.address.toLowerCase());
  }, [allTokens]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery('');
  };

  const handleImportToken = (tokenInfo: { address: `0x${string}`; name: string; symbol: string; decimals: number }) => {
    addToken(tokenInfo as CustomToken);
    toast.success(`${tokenInfo.symbol} imported successfully!`);
  };

  const handleRemoveToken = (e: React.MouseEvent, address: string, symbol: string) => {
    e.stopPropagation();
    removeToken(address);
    toast.success(`${symbol} removed from list`);
  };

  return (
    <>
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
              onChange={(e) => setSearchQuery(e.target.value.slice(0, 100))}
              className="pl-10 bg-secondary/50 border-border/50"
              maxLength={100}
            />
          </div>

          {/* Token List */}
          <div className="max-h-80 overflow-y-auto space-y-1 mt-4">
            {filteredTokens.map((token) => {
              const isSelected =
                selectedToken?.address.toLowerCase() === token.address.toLowerCase();
              const isDisabled =
                disabledToken?.address.toLowerCase() === token.address.toLowerCase();
              const isCustom = isCustomToken(token.address);

              return (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{token.symbol}</p>
                      {isCustom && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 bg-warning/10 text-warning border-warning/30">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                  {isCustom && !isSelected && (
                    <button
                      onClick={(e) => handleRemoveToken(e, token.address, token.symbol)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/20 transition-all"
                      title="Remove token"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}

            {/* No results */}
            {filteredTokens.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">No tokens found</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Import Custom Token
                </Button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <div className="pt-3 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Import Custom Token
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TokenImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportToken}
        existingAddresses={existingAddresses}
      />
    </>
  );
};

export default TokenSelector;
