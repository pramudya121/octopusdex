import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownUp, Loader2, Check, Wallet, RefreshCw, ExternalLink } from 'lucide-react';
import { CONTRACTS, PHAROS_TESTNET } from '@/config/contracts';
import { WETH_ABI } from '@/config/abis';
import { toast } from 'sonner';

const Wrap = () => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap');

  // PHRS Balance (native)
  const { data: phrsBalance, refetch: refetchPhrs } = useBalance({
    address,
  });

  // WPHRS Balance (ERC20)
  const { data: wphrsBalanceRaw, refetch: refetchWphrs } = useReadContract({
    address: CONTRACTS.WETH,
    abi: WETH_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const wphrsBalance = wphrsBalanceRaw ? formatUnits(wphrsBalanceRaw as bigint, 18) : '0';

  // Wrap PHRS to WPHRS
  const { writeContractAsync: wrap, data: wrapHash, isPending: isWrapping } = useWriteContract();
  const { isLoading: isWrapConfirming, isSuccess: isWrapSuccess } = useWaitForTransactionReceipt({
    hash: wrapHash,
  });

  // Unwrap WPHRS to PHRS
  const { writeContractAsync: unwrap, data: unwrapHash, isPending: isUnwrapping } = useWriteContract();
  const { isLoading: isUnwrapConfirming, isSuccess: isUnwrapSuccess } = useWaitForTransactionReceipt({
    hash: unwrapHash,
  });

  // Refetch balances after successful transactions
  useEffect(() => {
    if (isWrapSuccess || isUnwrapSuccess) {
      refetchPhrs();
      refetchWphrs();
      setAmount('');
    }
  }, [isWrapSuccess, isUnwrapSuccess, refetchPhrs, refetchWphrs]);

  const handleWrap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await wrap({
        address: CONTRACTS.WETH,
        abi: WETH_ABI,
        functionName: 'deposit',
        value: parseEther(amount),
      } as any);
      toast.success('Wrapping PHRS...');
    } catch (error: any) {
      console.error('Wrap error:', error);
      toast.error(error?.shortMessage || 'Failed to wrap PHRS');
    }
  };

  const handleUnwrap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await unwrap({
        address: CONTRACTS.WETH,
        abi: WETH_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      } as any);
      toast.success('Unwrapping WPHRS...');
    } catch (error: any) {
      console.error('Unwrap error:', error);
      toast.error(error?.shortMessage || 'Failed to unwrap WPHRS');
    }
  };

  const handleRefresh = () => {
    refetchPhrs();
    refetchWphrs();
    toast.success('Balances refreshed');
  };

  const setMaxAmount = () => {
    if (activeTab === 'wrap') {
      if (phrsBalance) {
        // Leave some for gas
        const maxAmount = parseFloat(formatEther(phrsBalance.value)) - 0.01;
        setAmount(maxAmount > 0 ? maxAmount.toFixed(6) : '0');
      }
    } else {
      setAmount(wphrsBalance);
    }
  };

  const isLoading = isWrapping || isWrapConfirming || isUnwrapping || isUnwrapConfirming;
  const phrsBalanceFormatted = phrsBalance ? parseFloat(formatEther(phrsBalance.value)).toFixed(4) : '0.00';
  const wphrsBalanceFormatted = parseFloat(wphrsBalance).toFixed(4);

  return (
    <>
      <Helmet>
        <title>Wrap/Unwrap PHRS | OCTOPUS DEX</title>
        <meta name="description" content="Wrap PHRS to WPHRS or Unwrap WPHRS to PHRS on OCTOPUS DEX" />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
              <ArrowDownUp className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Wrap / Unwrap
            </h1>
            <p className="text-muted-foreground">
              Convert between PHRS and WPHRS tokens
            </p>
          </div>

          {/* Main Card */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Token Wrapper</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/tokens/phrs.png" alt="PHRS" className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-muted-foreground">PHRS Balance</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {phrsBalanceFormatted}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/tokens/phrs.png" alt="WPHRS" className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-muted-foreground">WPHRS Balance</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {wphrsBalanceFormatted}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'wrap' | 'unwrap'); setAmount(''); }}>
                <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
                  <TabsTrigger value="wrap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Wrap PHRS
                  </TabsTrigger>
                  <TabsTrigger value="unwrap" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Unwrap WPHRS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wrap" className="space-y-4 mt-4">
                  <div className="token-input">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Amount to Wrap</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Balance: {phrsBalanceFormatted}</span>
                        <button
                          onClick={setMaxAmount}
                          className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-0.5 rounded bg-primary/10"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50">
                        <img src="/tokens/phrs.png" alt="PHRS" className="w-6 h-6 rounded-full" />
                        <span className="font-medium">PHRS</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
                      <ArrowDownUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="token-input opacity-70">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">You Will Receive</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={amount || '0.0'}
                        readOnly
                        className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50">
                        <img src="/tokens/phrs.png" alt="WPHRS" className="w-6 h-6 rounded-full" />
                        <span className="font-medium">WPHRS</span>
                      </div>
                    </div>
                  </div>

                  {!isConnected ? (
                    <Button variant="glow" className="w-full" disabled>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <Button
                      variant="glow"
                      className="w-full"
                      onClick={handleWrap}
                      disabled={isLoading || !amount || parseFloat(amount) <= 0}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isWrapSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Wrapped Successfully!
                        </>
                      ) : (
                        'Wrap PHRS'
                      )}
                    </Button>
                  )}

                  {wrapHash && (
                    <a
                      href={`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${wrapHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                    >
                      View Transaction <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </TabsContent>

                <TabsContent value="unwrap" className="space-y-4 mt-4">
                  <div className="token-input">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Amount to Unwrap</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Balance: {wphrsBalanceFormatted}</span>
                        <button
                          onClick={setMaxAmount}
                          className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-0.5 rounded bg-primary/10"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50">
                        <img src="/tokens/phrs.png" alt="WPHRS" className="w-6 h-6 rounded-full" />
                        <span className="font-medium">WPHRS</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
                      <ArrowDownUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <div className="token-input opacity-70">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">You Will Receive</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={amount || '0.0'}
                        readOnly
                        className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0"
                      />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50">
                        <img src="/tokens/phrs.png" alt="PHRS" className="w-6 h-6 rounded-full" />
                        <span className="font-medium">PHRS</span>
                      </div>
                    </div>
                  </div>

                  {!isConnected ? (
                    <Button variant="glow" className="w-full" disabled>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <Button
                      variant="glow"
                      className="w-full"
                      onClick={handleUnwrap}
                      disabled={isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(wphrsBalance)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isUnwrapSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Unwrapped Successfully!
                        </>
                      ) : (
                        'Unwrap WPHRS'
                      )}
                    </Button>
                  )}

                  {unwrapHash && (
                    <a
                      href={`${PHAROS_TESTNET.blockExplorers.default.url}/tx/${unwrapHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                    >
                      View Transaction <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </TabsContent>
              </Tabs>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-medium text-foreground mb-2">Why Wrap PHRS?</h4>
                <p className="text-sm text-muted-foreground">
                  WPHRS (Wrapped PHRS) is an ERC-20 compatible version of the native PHRS token. 
                  It's required for trading on decentralized exchanges and interacting with smart contracts.
                </p>
              </div>

              {/* Contract Info */}
              <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                <p className="text-xs text-muted-foreground">
                  WPHRS Contract: 
                  <a 
                    href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${CONTRACTS.WETH}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline font-mono"
                  >
                    {CONTRACTS.WETH.slice(0, 10)}...{CONTRACTS.WETH.slice(-8)}
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Wrap;