import { useState } from 'react';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { TOKEN_LIST, CONTRACTS } from '@/config/contracts';
import { useAccount, useWriteContract } from 'wagmi';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
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

// Mock faucet - in real testnet, this would call actual faucet contracts
const faucetTokens = TOKEN_LIST.filter(t => !t.isNative && t.symbol !== 'WPHRS');

const Faucet = () => {
  const { isConnected, address } = useAccount();
  const [mintingToken, setMintingToken] = useState<string | null>(null);
  const [mintedTokens, setMintedTokens] = useState<Set<string>>(new Set());
  const { writeContractAsync } = useWriteContract();

  const handleMint = async (tokenSymbol: string, tokenAddress: `0x${string}`) => {
    if (!address) return;
    
    setMintingToken(tokenSymbol);
    try {
      toast.loading(`Requesting ${tokenSymbol} tokens...`, { id: 'faucet' });
      
      // Try to call mint function - may not exist on all tokens
      // This is a mock - real faucets would have dedicated faucet contracts
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: [{
          inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
          name: 'mint',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        }],
        functionName: 'mint',
        args: [address, parseUnits('1000', tokenSymbol === 'USDC' ? 6 : 18)],
      } as any);
      
      setMintedTokens(prev => new Set([...prev, tokenSymbol]));
      toast.success(`${tokenSymbol} tokens received!`, { id: 'faucet' });
    } catch (error: any) {
      console.error('Faucet error:', error);
      // If mint fails, show info about getting testnet tokens
      toast.error(`Faucet not available. Get testnet tokens from Pharos faucet.`, { id: 'faucet' });
    } finally {
      setMintingToken(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Faucet - OCTOPUS DEX</title>
        <meta name="description" content="Get testnet tokens to try OCTOPUS DEX on Pharos Atlantic Testnet." />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Droplet className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Token Faucet</h1>
            <p className="text-muted-foreground">Get testnet tokens to try OCTOPUS DEX</p>
          </div>

          {/* Native Token Faucet */}
          <Card className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Native Token (PHRS)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Get PHRS tokens from the official Pharos faucet to pay for gas fees.
            </p>
            <a 
              href="https://pharos-atlantic-testnet.socialscan.io/faucet" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Pharos Faucet
              </Button>
            </a>
          </Card>

          {/* ERC20 Token Faucets */}
          <Card className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Test Tokens</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Request test tokens to use on OCTOPUS DEX. Each request gives you 1,000 tokens.
            </p>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Connect your wallet to use the faucet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faucetTokens.map((token) => (
                  <div 
                    key={token.symbol}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={getTokenLogo(token.symbol)} 
                        alt={token.symbol} 
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold">{token.symbol}</p>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {mintedTokens.has(token.symbol) && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      <Button
                        variant={mintedTokens.has(token.symbol) ? 'outline' : 'glow'}
                        size="sm"
                        disabled={mintingToken !== null}
                        onClick={() => handleMint(token.symbol, token.address)}
                      >
                        {mintingToken === token.symbol ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Requesting...
                          </>
                        ) : mintedTokens.has(token.symbol) ? (
                          'Request Again'
                        ) : (
                          'Request Tokens'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-xl">
              <p className="text-sm">
                <strong>Note:</strong> These are testnet tokens with no real value. 
                They are only for testing purposes on Pharos Atlantic Testnet.
              </p>
            </div>
          </Card>

          {/* Token Addresses */}
          <Card className="glass-card p-6 mt-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Token Addresses</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add these tokens to your wallet to see your balance.
            </p>
            <div className="space-y-3 text-sm">
              {faucetTokens.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="font-medium">{token.symbol}</span>
                  <code className="text-xs text-muted-foreground font-mono">
                    {token.address.slice(0, 10)}...{token.address.slice(-8)}
                  </code>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Faucet;
