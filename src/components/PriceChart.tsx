import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { TOKEN_LIST, Token, CONTRACTS } from '@/config/contracts';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

interface PriceChartProps {
  tokenA?: Token;
  tokenB?: Token;
  className?: string;
}

const timeframes = ['1H', '24H', '7D', '30D'] as const;
type Timeframe = typeof timeframes[number];

// Generate mock price data based on current reserves
const generatePriceData = (basePrice: number, timeframe: Timeframe) => {
  const points = timeframe === '1H' ? 60 : timeframe === '24H' ? 24 : timeframe === '7D' ? 7 : 30;
  const volatility = timeframe === '1H' ? 0.005 : timeframe === '24H' ? 0.02 : timeframe === '7D' ? 0.05 : 0.1;
  
  const data = [];
  let price = basePrice * (1 - volatility * 2);
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.45) * volatility * basePrice;
    price = Math.max(price + change, basePrice * 0.5);
    
    const time = new Date();
    if (timeframe === '1H') {
      time.setMinutes(time.getMinutes() - (points - i));
    } else if (timeframe === '24H') {
      time.setHours(time.getHours() - (points - i));
    } else {
      time.setDate(time.getDate() - (points - i));
    }
    
    data.push({
      time: timeframe === '1H' 
        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : timeframe === '24H'
        ? time.toLocaleTimeString([], { hour: '2-digit' })
        : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: price,
    });
  }
  
  // Ensure last point is close to current price
  data[data.length - 1].price = basePrice;
  
  return data;
};

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

const FACTORY_ABI = [
  {
    constant: true,
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'getPair',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint112', name: '_reserve0', type: 'uint112' },
      { internalType: 'uint112', name: '_reserve1', type: 'uint112' },
      { internalType: 'uint32', name: '_blockTimestampLast', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const PriceChart = ({ 
  tokenA = TOKEN_LIST.find(t => t.symbol === 'OCTO')!, 
  tokenB = TOKEN_LIST.find(t => t.symbol === 'USDC')!,
  className = ''
}: PriceChartProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState<{ time: string; price: number }[]>([]);

  // Get pair address
  const tokenAAddress = tokenA.isNative ? CONTRACTS.WETH : tokenA.address;
  const tokenBAddress = tokenB.isNative ? CONTRACTS.WETH : tokenB.address;

  const { data: pairAddress } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenAAddress, tokenBAddress],
  });

  // Get reserves
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Get token0 to determine order
  const { data: token0Address } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'token0',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (!reserves || !token0Address) return 1;
    
    const [reserve0, reserve1] = reserves;
    const isTokenAToken0 = token0Address.toLowerCase() === tokenAAddress.toLowerCase();
    
    const reserveA = isTokenAToken0 ? reserve0 : reserve1;
    const reserveB = isTokenAToken0 ? reserve1 : reserve0;
    
    if (reserveA === BigInt(0)) return 0;
    
    const decimalsA = tokenA.decimals;
    const decimalsB = tokenB.decimals;
    
    const priceRaw = (Number(reserveB) / Number(reserveA)) * Math.pow(10, decimalsA - decimalsB);
    return priceRaw;
  }, [reserves, token0Address, tokenAAddress, tokenA.decimals, tokenB.decimals]);

  // Generate price data when price changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const data = generatePriceData(currentPrice || 1, timeframe);
      setPriceData(data);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPrice, timeframe]);

  const handleRefresh = () => {
    refetchReserves();
    setIsLoading(true);
    setTimeout(() => {
      const data = generatePriceData(currentPrice || 1, timeframe);
      setPriceData(data);
      setIsLoading(false);
    }, 500);
  };

  // Calculate price change
  const priceChange = useMemo(() => {
    if (priceData.length < 2) return 0;
    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }, [priceData]);

  const isPositive = priceChange >= 0;

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                src={getTokenLogo(tokenA.symbol)}
                alt={tokenA.symbol}
                className="w-8 h-8 rounded-full border-2 border-background"
              />
              <img
                src={getTokenLogo(tokenB.symbol)}
                alt={tokenB.symbol}
                className="w-8 h-8 rounded-full border-2 border-background -ml-3"
              />
            </div>
            <div>
              <CardTitle className="text-lg">
                {tokenA.symbol}/{tokenB.symbol}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-foreground">
                  {currentPrice.toFixed(tokenB.symbol === 'USDC' ? 2 : 6)}
                </span>
                <Badge
                  variant={isPositive ? 'default' : 'destructive'}
                  className={isPositive ? 'bg-success/20 text-success' : ''}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(priceChange).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-secondary/30 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[300px] rounded-xl" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dx={-10}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value: number) => [
                    `${value.toFixed(6)} ${tokenB.symbol}`,
                    'Price',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceChart;
