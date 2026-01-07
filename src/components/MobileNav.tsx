import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, X, ArrowLeftRight, Droplets, Layers, 
  BarChart3, History, Wallet, RefreshCw, BookOpen
} from 'lucide-react';
import octopusLogo from '@/assets/octopus-logo.png';

const navItems = [
  { path: '/', label: 'Swap', icon: ArrowLeftRight },
  { path: '/liquidity', label: 'Liquidity', icon: Droplets },
  { path: '/pools', label: 'Pools', icon: Layers },
  { path: '/wrap', label: 'Wrap', icon: RefreshCw },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
  { path: '/portfolio', label: 'Portfolio', icon: Wallet },
  { path: '/docs', label: 'Docs', icon: BookOpen },
];

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="glass-card border-r-primary/20 w-72">
        <SheetHeader className="pb-6 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <img src={octopusLogo} alt="OCTOPUS" className="w-10 h-10" />
            <span className="text-xl font-bold text-gradient">OCTOPUS DEX</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Network</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-medium text-sm">Pharos Testnet</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
