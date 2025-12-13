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

export const wagmiConfig = createConfig({
  chains: [pharosTestnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [pharosTestnet.id]: http('https://atlantic.dplabs-internal.com'),
  },
});
