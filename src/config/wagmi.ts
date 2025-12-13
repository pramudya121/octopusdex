import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

// Define Pharos Atlantic Testnet
export const pharosTestnet = defineChain({
  id: 688689,
  name: 'Pharos Atlantic Testnet',
  nativeCurrency: {
    name: 'PHRS',
    symbol: 'PHRS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://atlantic.dplabs-internal.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Pharos Explorer',
      url: 'https://pharos-atlantic-testnet.socialscan.io',
    },
  },
  testnet: true,
});

// Wallet connectors
const connectors = [
  injected({
    target: 'metaMask',
  }),
  injected({
    target: {
      id: 'okxWallet',
      name: 'OKX Wallet',
      provider: (window: any) => window.okxwallet,
    },
  }),
  injected({
    target: {
      id: 'rabby',
      name: 'Rabby Wallet',
      provider: (window: any) => window.rabby,
    },
  }),
  injected({
    target: {
      id: 'bitget',
      name: 'Bitget Wallet',
      provider: (window: any) => window.bitkeep?.ethereum,
    },
  }),
  injected(), // Fallback for any injected wallet
];

export const wagmiConfig = createConfig({
  chains: [pharosTestnet],
  connectors,
  transports: {
    [pharosTestnet.id]: http('https://atlantic.dplabs-internal.com'),
  },
});
