import Header from '@/components/Header';
import SwapCard from '@/components/SwapCard';
import WaveBackground from '@/components/WaveBackground';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>OCTOPUS DEX - Decentralized Exchange on Pharos Network</title>
        <meta name="description" content="Swap tokens instantly on OCTOPUS DEX, the leading DEX on Pharos Network testnet." />
      </Helmet>

      <WaveBackground />
      <Header />
      
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trade with the <span className="text-gradient">Octopus</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Swap, provide liquidity, and earn on Pharos Network.
            </p>
          </div>

          <SwapCard />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold text-gradient">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Total Volume</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold text-gradient">$0</p>
              <p className="text-sm text-muted-foreground mt-1">TVL</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold text-gradient">0</p>
              <p className="text-sm text-muted-foreground mt-1">Total Pairs</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-3xl font-bold text-gradient">0</p>
              <p className="text-sm text-muted-foreground mt-1">Transactions</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Index;
