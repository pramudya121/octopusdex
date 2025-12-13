import Header from '@/components/Header';
import WaveBackground from '@/components/WaveBackground';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';
import { CONTRACTS, TOKENS, PHAROS_TESTNET } from '@/config/contracts';
import { 
  BookOpen, Code, Rocket, Shield, Zap, 
  ExternalLink, Copy, Check, Layers, 
  GitBranch, Clock, Target, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import octoLogo from '@/assets/octopus-logo.png';

const ContractCard = ({ name, address, description }: { name: string; address: string; description: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-foreground">{name}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <a 
          href={`${PHAROS_TESTNET.blockExplorers.default.url}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <code className="flex-1 text-xs font-mono bg-background/50 p-2 rounded truncate">
          {address}
        </code>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAddress}>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

const RoadmapItem = ({ phase, title, items, status }: { phase: string; title: string; items: string[]; status: 'completed' | 'in-progress' | 'upcoming' }) => {
  const statusColors = {
    'completed': 'bg-green-500/20 text-green-400 border-green-500/50',
    'in-progress': 'bg-primary/20 text-primary border-primary/50',
    'upcoming': 'bg-muted text-muted-foreground border-muted'
  };
  
  const statusLabels = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'upcoming': 'Upcoming'
  };

  return (
    <div className="relative pl-8 pb-8 border-l-2 border-border last:border-l-0 last:pb-0">
      <div className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500' : status === 'in-progress' ? 'bg-primary' : 'bg-muted'}`}>
        {status === 'completed' ? <Check className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3" />}
      </div>
      <div className="mb-2">
        <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
      </div>
      <h4 className="text-lg font-bold mb-1">{phase}: {title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronRight className="w-3 h-3 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Docs = () => {
  return (
    <>
      <Helmet>
        <title>Documentation - OCTOPUS DEX</title>
        <meta name="description" content="Learn about OCTOPUS DEX, a decentralized exchange on Pharos Atlantic Testnet" />
      </Helmet>
      <WaveBackground />
      <Header />
      
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex justify-center mb-6">
              <img src={octoLogo} alt="OCTOPUS DEX" className="w-24 h-24 rounded-2xl shadow-lg shadow-primary/20" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">OCTOPUS</span> DEX Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A fully decentralized exchange built on Pharos Atlantic Testnet with UniswapV2-style AMM
            </p>
          </div>

          {/* What is OCTOPUS DEX */}
          <Card className="glass-card p-8 mb-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">What is OCTOPUS DEX?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  OCTOPUS DEX is a decentralized exchange (DEX) that enables trustless token swaps on the Pharos Atlantic Testnet. 
                  Built using the proven UniswapV2 Automated Market Maker (AMM) model, OCTOPUS DEX allows users to swap tokens, 
                  provide liquidity to earn trading fees, and explore analytics—all directly from their wallets without intermediaries.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/30 rounded-xl text-center">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Fast & Cheap</h3>
                <p className="text-sm text-muted-foreground">Low gas fees on Pharos Testnet</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Non-Custodial</h3>
                <p className="text-sm text-muted-foreground">You control your assets</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-xl text-center">
                <Layers className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Multi-hop Routing</h3>
                <p className="text-sm text-muted-foreground">Best prices via optimal paths</p>
              </div>
            </div>
          </Card>

          {/* Technology Stack */}
          <Card className="glass-card p-8 mb-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Technology Stack</h2>
                <p className="text-muted-foreground">Built with modern, battle-tested technologies</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-primary">Smart Contracts</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Solidity</Badge>
                    <span className="text-muted-foreground">UniswapV2 Fork</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">EVM</Badge>
                    <span className="text-muted-foreground">Pharos Compatible</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">AMM</Badge>
                    <span className="text-muted-foreground">Constant Product Formula</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-primary">Frontend</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">React</Badge>
                    <span className="text-muted-foreground">TypeScript + Vite</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">Wagmi</Badge>
                    <span className="text-muted-foreground">Wallet Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline">TailwindCSS</Badge>
                    <span className="text-muted-foreground">Modern UI/UX</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Development Process */}
          <Card className="glass-card p-8 mb-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <GitBranch className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Development Process</h2>
                <p className="text-muted-foreground">Step-by-step building approach</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { step: '1', title: 'Smart Contract Development', desc: 'Deployed UniswapV2 Factory, Router, and Library contracts to Pharos Testnet' },
                { step: '2', title: 'Token Deployment', desc: 'Created test tokens (OCTO, BNB, ETH, USDC) for trading pairs' },
                { step: '3', title: 'Frontend Development', desc: 'Built React frontend with Wagmi for wallet connectivity and contract interactions' },
                { step: '4', title: 'Core Features', desc: 'Implemented swap, liquidity add/remove with real on-chain transactions' },
                { step: '5', title: 'Multi-hop Routing', desc: 'Added intelligent routing to find best prices across multiple pools' },
                { step: '6', title: 'Analytics & Portfolio', desc: 'Created dashboards for TVL, volume tracking, and user positions' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contract Addresses */}
          <Card className="glass-card p-8 mb-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Smart Contract Addresses</h2>
                <p className="text-muted-foreground">All contracts deployed on Pharos Atlantic Testnet (Chain ID: {PHAROS_TESTNET.id})</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-primary">Core Contracts</h3>
              <div className="grid gap-3">
                <ContractCard name="Factory" address={CONTRACTS.FACTORY} description="Creates and tracks all trading pairs" />
                <ContractCard name="Router" address={CONTRACTS.ROUTER} description="Handles swaps and liquidity operations" />
                <ContractCard name="WETH (WPHRS)" address={CONTRACTS.WETH} description="Wrapped native token for trading" />
                <ContractCard name="Multicall" address={CONTRACTS.MULTICALL} description="Batch multiple contract calls" />
                <ContractCard name="Library" address={CONTRACTS.LIBRARY} description="Helper functions for calculations" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-primary">Token Addresses</h3>
              <div className="grid gap-3">
                <ContractCard name="OCTO" address={TOKENS.OCTO} description="Octopus DEX native token" />
                <ContractCard name="BNB" address={TOKENS.BNB} description="Test BNB token" />
                <ContractCard name="ETH" address={TOKENS.ETH} description="Test ETH token" />
                <ContractCard name="USDC" address={TOKENS.USDC} description="Test stablecoin (6 decimals)" />
              </div>
            </div>
          </Card>

          {/* Roadmap */}
          <Card className="glass-card p-8 animate-fade-in">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Roadmap</h2>
                <p className="text-muted-foreground">Our journey and future plans</p>
              </div>
            </div>
            
            <div className="space-y-0">
              <RoadmapItem 
                phase="Phase 1" 
                title="Core Infrastructure" 
                status="completed"
                items={[
                  'Deploy UniswapV2 contracts to Pharos Testnet',
                  'Create test tokens (OCTO, BNB, ETH, USDC)',
                  'Basic swap functionality',
                  'Wallet integration (MetaMask, OKX, Rabby, Bitget)'
                ]}
              />
              <RoadmapItem 
                phase="Phase 2" 
                title="Core Features" 
                status="completed"
                items={[
                  'Add/Remove liquidity functionality',
                  'Multi-hop swap routing for best prices',
                  'Token approval flow',
                  'Real-time price calculations'
                ]}
              />
              <RoadmapItem 
                phase="Phase 3" 
                title="Analytics & UX" 
                status="in-progress"
                items={[
                  'Analytics dashboard with charts',
                  'Portfolio tracking',
                  'Pool explorer',
                  'Modern responsive UI'
                ]}
              />
              <RoadmapItem 
                phase="Phase 4" 
                title="Advanced Features" 
                status="upcoming"
                items={[
                  'Limit orders',
                  'Price charts and historical data',
                  'Farming and staking',
                  'Governance token'
                ]}
              />
              <RoadmapItem 
                phase="Phase 5" 
                title="Mainnet Launch" 
                status="upcoming"
                items={[
                  'Security audit',
                  'Mainnet deployment',
                  'Token launch',
                  'Community building'
                ]}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Docs;