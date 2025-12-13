import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConnect } from 'wagmi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletOptions = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    description: 'Connect with MetaMask browser extension',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    icon: 'https://static.okx.com/cdn/assets/imgs/221/C5E7F93B6C22D58C.png',
    description: 'Connect with OKX Wallet',
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    icon: 'https://rabby.io/assets/images/logo-128.png',
    description: 'Connect with Rabby Wallet',
  },
  {
    id: 'bitget',
    name: 'Bitget Wallet',
    icon: 'https://web3.bitget.com/favicon.ico',
    description: 'Connect with Bitget Wallet',
  },
];

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = async () => {
    try {
      // Use the first available injected connector
      const connector = connectors[0];
      
      if (!connector) {
        toast.error('No wallet detected. Please install MetaMask or another Web3 wallet.');
        return;
      }

      // Check if provider is available
      const provider = await connector.getProvider?.().catch(() => null);
      
      if (!provider) {
        toast.error('Please install a Web3 wallet like MetaMask to connect.');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      connect(
        { connector },
        {
          onSuccess: () => {
            toast.success('Wallet connected successfully!');
            onClose();
          },
          onError: (error) => {
            console.error('Connection error:', error);
            if (error.message?.includes('rejected')) {
              toast.error('Connection rejected by user');
            } else {
              toast.error('Failed to connect. Please try again.');
            }
          },
        }
      );
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={handleConnect}
              disabled={isPending}
              className="wallet-btn w-full group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              ) : (
                <img
                  src={wallet.icon}
                  alt={wallet.name}
                  className="w-10 h-10 rounded-xl object-contain bg-background p-1"
                />
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {wallet.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wallet.description}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-muted group-hover:bg-primary transition-colors" />
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          By connecting, you agree to our Terms of Service
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WalletModal;
