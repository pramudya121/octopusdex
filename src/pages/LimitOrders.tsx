import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  X, 
  Plus,
  ArrowRight,
  Wallet,
  Info
} from 'lucide-react';
import { TOKEN_LIST, Token, CONTRACTS } from '@/config/contracts';
import TokenSelector from '@/components/TokenSelector';
import { toast } from 'sonner';

interface LimitOrder {
  id: string;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  targetPrice: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
}

// Mock limit orders for demonstration
const mockOrders: LimitOrder[] = [
  {
    id: '1',
    tokenIn: TOKEN_LIST.find(t => t.symbol === 'OCTO')!,
    tokenOut: TOKEN_LIST.find(t => t.symbol === 'USDC')!,
    amountIn: '100',
    targetPrice: '1.50',
    createdAt: new Date(Date.now() - 3600000),
    expiresAt: new Date(Date.now() + 86400000),
    status: 'pending',
  },
  {
    id: '2',
    tokenIn: TOKEN_LIST.find(t => t.symbol === 'ETH')!,
    tokenOut: TOKEN_LIST.find(t => t.symbol === 'USDC')!,
    amountIn: '0.5',
    targetPrice: '2500',
    createdAt: new Date(Date.now() - 7200000),
    expiresAt: new Date(Date.now() + 172800000),
    status: 'pending',
  },
];

const getTokenLogo = (symbol: string): string => {
  const logoMap: Record<string, string> = {
    'PHRS': '/tokens/phrs.png',
    'WPHRS': '/tokens/phrs.png',
    'OCTO': '/tokens/octo.png',
    'BNB': '/tokens/bnb.png',
    'ETH': '/tokens/eth.png',
    'USDC': '/tokens/usdc.png',
  };
  return logoMap[symbol] || '/tokens/octo.png';
};

const LimitOrders = () => {
  const { address, isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState<Token>(TOKEN_LIST.find(t => t.symbol === 'OCTO')!);
  const [tokenOut, setTokenOut] = useState<Token>(TOKEN_LIST.find(t => t.symbol === 'USDC')!);
  const [amountIn, setAmountIn] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [orders, setOrders] = useState<LimitOrder[]>(mockOrders);
  const [showTokenInSelector, setShowTokenInSelector] = useState(false);
  const [showTokenOutSelector, setShowTokenOutSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [expiryDays, setExpiryDays] = useState('7');

  const { data: tokenBalance } = useBalance({
    address,
  });

  const currentPrice = 1.25; // Mock current price
  const priceChange = ((parseFloat(targetPrice || '0') - currentPrice) / currentPrice) * 100;

  const handleCreateOrder = () => {
    if (!amountIn || !targetPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const newOrder: LimitOrder = {
      id: Date.now().toString(),
      tokenIn,
      tokenOut,
      amountIn,
      targetPrice,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + parseInt(expiryDays) * 86400000),
      status: 'pending',
    };

    setOrders([newOrder, ...orders]);
    toast.success('Limit order created successfully!');
    setAmountIn('');
    setTargetPrice('');
    setActiveTab('orders');
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    ));
    toast.success('Order cancelled');
  };

  const setMaxAmount = () => {
    if (tokenBalance) {
      setAmountIn(formatEther(tokenBalance.value));
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <>
      <Helmet>
        <title>Limit Orders | OCTOPUS DEX</title>
        <meta name="description" content="Create limit orders for automatic swap execution at target prices" />
      </Helmet>

      <WaveBackground />
      <Header />

      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Limit Orders
            </h1>
            <p className="text-muted-foreground">
              Set target prices for automatic swap execution
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-secondary/30">
              <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="w-4 h-4 mr-2" />
                My Orders ({orders.filter(o => o.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Create Order Form */}
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle>Create Limit Order</CardTitle>
                    <CardDescription>
                      Your order will execute automatically when the target price is reached
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Token In */}
                    <div className="token-input">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">You Pay</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Balance: {tokenBalance ? parseFloat(formatEther(tokenBalance.value)).toFixed(4) : '0'}
                          </span>
                          <button
                            onClick={setMaxAmount}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amountIn}
                          onChange={(e) => setAmountIn(e.target.value)}
                          className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0 flex-1"
                        />
                        <button
                          onClick={() => setShowTokenInSelector(true)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          <img src={getTokenLogo(tokenIn.symbol)} alt={tokenIn.symbol} className="w-6 h-6 rounded-full" />
                          <span className="font-medium">{tokenIn.symbol}</span>
                        </button>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    {/* Token Out */}
                    <div className="token-input">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">You Receive</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="text"
                          placeholder="0.0"
                          value={amountIn && targetPrice ? (parseFloat(amountIn) * parseFloat(targetPrice)).toFixed(6) : ''}
                          readOnly
                          className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0 flex-1"
                        />
                        <button
                          onClick={() => setShowTokenOutSelector(true)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          <img src={getTokenLogo(tokenOut.symbol)} alt={tokenOut.symbol} className="w-6 h-6 rounded-full" />
                          <span className="font-medium">{tokenOut.symbol}</span>
                        </button>
                      </div>
                    </div>

                    {/* Target Price */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Target Price ({tokenOut.symbol} per {tokenIn.symbol})</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="bg-secondary/30 border-border/50"
                        />
                        <Badge 
                          variant={priceChange > 0 ? 'default' : 'destructive'}
                          className={priceChange > 0 ? 'bg-success/20 text-success' : ''}
                        >
                          {priceChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {priceChange.toFixed(2)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Current price: {currentPrice} {tokenOut.symbol}
                      </p>
                    </div>

                    {/* Expiry */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Order Expires In</label>
                      <div className="flex gap-2">
                        {['1', '7', '30'].map((days) => (
                          <button
                            key={days}
                            onClick={() => setExpiryDays(days)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                              expiryDays === days
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {days} {parseInt(days) === 1 ? 'Day' : 'Days'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    {!isConnected ? (
                      <Button variant="glow" className="w-full" disabled>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button
                        variant="glow"
                        className="w-full"
                        onClick={handleCreateOrder}
                        disabled={!amountIn || !targetPrice}
                      >
                        Create Limit Order
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Info Panel */}
                <div className="space-y-6">
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        How Limit Orders Work
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Set Your Target</h4>
                          <p className="text-sm text-muted-foreground">
                            Choose the price at which you want your swap to execute
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Tokens Are Locked</h4>
                          <p className="text-sm text-muted-foreground">
                            Your tokens are held securely until the order fills or expires
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Auto Execution</h4>
                          <p className="text-sm text-muted-foreground">
                            When price reaches your target, the swap executes automatically
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-warning/20 bg-warning/5">
                    <CardContent className="flex gap-3 pt-6">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Beta Feature</h4>
                        <p className="text-sm text-muted-foreground">
                          Limit orders are in beta. Orders are simulated and stored locally for demonstration purposes.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Your Limit Orders</CardTitle>
                  <CardDescription>
                    Manage your pending and past limit orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Orders Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first limit order to get started
                      </p>
                      <Button variant="outline" onClick={() => setActiveTab('create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Order
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className={`p-4 rounded-xl border transition-all ${
                              order.status === 'pending'
                                ? 'bg-secondary/30 border-border/50 hover:border-primary/30'
                                : order.status === 'filled'
                                ? 'bg-success/10 border-success/30'
                                : 'bg-destructive/10 border-destructive/30 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                  <img
                                    src={getTokenLogo(order.tokenIn.symbol)}
                                    alt={order.tokenIn.symbol}
                                    className="w-10 h-10 rounded-full border-2 border-background"
                                  />
                                  <img
                                    src={getTokenLogo(order.tokenOut.symbol)}
                                    alt={order.tokenOut.symbol}
                                    className="w-10 h-10 rounded-full border-2 border-background -ml-3"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">
                                      {order.amountIn} {order.tokenIn.symbol}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-semibold text-foreground">
                                      {order.tokenOut.symbol}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Target: {order.targetPrice} {order.tokenOut.symbol}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <Badge
                                    variant={
                                      order.status === 'pending' ? 'secondary' :
                                      order.status === 'filled' ? 'default' : 'destructive'
                                    }
                                    className={order.status === 'pending' ? 'bg-warning/20 text-warning' : ''}
                                  >
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                  {order.status === 'pending' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {formatTimeRemaining(order.expiresAt)}
                                    </p>
                                  )}
                                </div>
                                {order.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Token Selectors */}
      <TokenSelector
        isOpen={showTokenInSelector}
        onClose={() => setShowTokenInSelector(false)}
        onSelect={(token) => {
          setTokenIn(token);
          setShowTokenInSelector(false);
        }}
        selectedToken={tokenIn}
      />
      <TokenSelector
        isOpen={showTokenOutSelector}
        onClose={() => setShowTokenOutSelector(false)}
        onSelect={(token) => {
          setTokenOut(token);
          setShowTokenOutSelector(false);
        }}
        selectedToken={tokenOut}
      />
    </>
  );
};

export default LimitOrders;
