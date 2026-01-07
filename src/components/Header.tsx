import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect } from 'wagmi';
import { useState } from 'react';
import { ArrowLeftRight, Droplets, LayoutGrid, BarChart3, Wallet, Menu, X, BookOpen, ArrowDownUp, History } from 'lucide-react';
import octopusLogo from '@/assets/octopus-logo.png';
import WalletModal from './WalletModal';
import PendingTransactions from './PendingTransactions';
import ThemeToggle from './ThemeToggle';
import { usePendingTransactions } from '@/hooks/usePendingTransactions';

const navItems = [
  { path: '/', label: 'Swap', icon: ArrowLeftRight },
  { path: '/liquidity', label: 'Liquidity', icon: Droplets },
  { path: '/wrap', label: 'Wrap', icon: ArrowDownUp },
  { path: '/pools', label: 'Pools', icon: LayoutGrid },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/history', label: 'History', icon: History },
  { path: '/docs', label: 'Docs', icon: BookOpen },
];

const Header = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { transactions, pendingCount, clearCompleted } = usePendingTransactions();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={octopusLogo} 
              alt="Octopus DEX" 
              className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xl font-bold text-gradient hidden sm:block">
              OCTOPUS DEX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Pending Transactions */}
            {isConnected && (
              <PendingTransactions 
                transactions={transactions}
                pendingCount={pendingCount}
                onClearCompleted={clearCompleted}
              />
            )}

            {isConnected && address ? (
              <Button
                variant="glass"
                onClick={() => disconnect()}
                className="hidden sm:flex"
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {formatAddress(address)}
              </Button>
            ) : (
              <Button
                variant="glow"
                onClick={() => setIsWalletModalOpen(true)}
                className="hidden sm:flex"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-fade-in">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Wallet Button */}
              <div className="pt-4 border-t border-border/50 mt-2">
                {isConnected && address ? (
                  <Button
                    variant="glass"
                    onClick={() => {
                      disconnect();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    {formatAddress(address)}
                  </Button>
                ) : (
                  <Button
                    variant="glow"
                    onClick={() => {
                      setIsWalletModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
};

export default Header;
