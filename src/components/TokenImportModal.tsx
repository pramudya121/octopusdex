import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, Search, Plus, ExternalLink } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { isAddress } from 'viem';
import { PHAROS_TESTNET } from '@/config/contracts';
import { z } from 'zod';

// Validation schema for contract address
const addressSchema = z.string()
  .trim()
  .min(1, 'Contract address is required')
  .refine((val) => isAddress(val), 'Invalid Ethereum address format');

interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
}

interface TokenImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (token: TokenInfo) => void;
  existingAddresses: string[];
}

// ERC20 ABIs for reading token info
const nameAbi = [{ inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }] as const;
const symbolAbi = [{ inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }] as const;
const decimalsAbi = [{ inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' }] as const;

const TokenImportModal = ({ isOpen, onClose, onImport, existingAddresses }: TokenImportModalProps) => {
  const [inputAddress, setInputAddress] = useState('');
  const [validatedAddress, setValidatedAddress] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Read token info only when we have a validated address
  const { data: tokenName, isLoading: isLoadingName } = useReadContract({
    address: validatedAddress || undefined,
    abi: nameAbi,
    functionName: 'name',
    query: { enabled: !!validatedAddress },
  });

  const { data: tokenSymbol, isLoading: isLoadingSymbol } = useReadContract({
    address: validatedAddress || undefined,
    abi: symbolAbi,
    functionName: 'symbol',
    query: { enabled: !!validatedAddress },
  });

  const { data: tokenDecimals, isLoading: isLoadingDecimals } = useReadContract({
    address: validatedAddress || undefined,
    abi: decimalsAbi,
    functionName: 'decimals',
    query: { enabled: !!validatedAddress },
  });

  const isLoading = isLoadingName || isLoadingSymbol || isLoadingDecimals || isSearching;
  const hasTokenInfo = tokenName && tokenSymbol && tokenDecimals !== undefined;

  const handleSearch = () => {
    setError(null);
    setValidatedAddress(null);

    // Validate input
    const result = addressSchema.safeParse(inputAddress);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    const address = result.data as `0x${string}`;

    // Check if token already exists
    if (existingAddresses.some(a => a.toLowerCase() === address.toLowerCase())) {
      setError('This token is already in your list');
      return;
    }

    setIsSearching(true);
    setValidatedAddress(address);
    
    // Small delay to allow contract reads to start
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleImport = () => {
    if (!validatedAddress || !tokenName || !tokenSymbol || tokenDecimals === undefined) return;

    // Validate token info
    if (typeof tokenName !== 'string' || tokenName.length === 0 || tokenName.length > 50) {
      setError('Invalid token name');
      return;
    }
    if (typeof tokenSymbol !== 'string' || tokenSymbol.length === 0 || tokenSymbol.length > 20) {
      setError('Invalid token symbol');
      return;
    }

    onImport({
      address: validatedAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: Number(tokenDecimals),
    });

    // Reset state
    setInputAddress('');
    setValidatedAddress(null);
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setInputAddress('');
    setValidatedAddress(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Import Custom Token
          </DialogTitle>
          <DialogDescription>
            Add any ERC20 token by entering its contract address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <Alert className="border-warning/30 bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-sm text-warning">
              Anyone can create a token with any name. Make sure you trust the source.
            </AlertDescription>
          </Alert>

          {/* Address Input */}
          <div className="space-y-2">
            <Label htmlFor="token-address">Token Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="token-address"
                placeholder="0x..."
                value={inputAddress}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 42); // Limit to valid address length
                  setInputAddress(value);
                  setError(null);
                  if (!value) setValidatedAddress(null);
                }}
                className="flex-1 font-mono text-sm"
                maxLength={42}
              />
              <Button
                variant="secondary"
                onClick={handleSearch}
                disabled={isLoading || !inputAddress}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Token Preview */}
          {validatedAddress && !isLoading && hasTokenInfo && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {(tokenSymbol as string).charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{tokenSymbol as string}</p>
                    <p className="text-sm text-muted-foreground">{tokenName as string}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Decimals</p>
                  <p className="font-medium">{Number(tokenDecimals)}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="font-medium">Pharos Testnet</p>
                </div>
              </div>

              <a
                href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${validatedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Not found state */}
          {validatedAddress && !isLoading && !hasTokenInfo && (
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-sm text-destructive">
                Could not find a valid ERC20 token at this address. Please verify the contract address.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={handleImport}
              disabled={!hasTokenInfo || isLoading}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Import Token
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenImportModal;
