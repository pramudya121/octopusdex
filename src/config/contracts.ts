// OCTOPUS DEX Contract Configuration for Pharos Atlantic Testnet

export const CHAIN_ID = 688689;

export const PHAROS_TESTNET = {
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
    public: {
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
} as const;

// Contract Addresses
export const CONTRACTS = {
  FACTORY: '0x03FC8270e3907f9B8c15f29a79f8F5E2F84BeCe9' as `0x${string}`,
  ROUTER: '0x8FA75F65Aa434d87a21435A64B3a54b2F70F9CDD' as `0x${string}`,
  WETH: '0x2C0D2ff171D0BdA5706e220C14DC116186AB156A' as `0x${string}`,
  MULTICALL: '0x01426dDCd7CFf512C331e56794A12D955D64c263' as `0x${string}`,
  LIBRARY: '0x33d3c9DC1D84613FCc9356353435c35C3c08ea63' as `0x${string}`,
} as const;

// Token Addresses
export const TOKENS = {
  OCTO: '0xf45135aab4285e4a4061d2ef16b96a0a8560cbd6' as `0x${string}`,
  BNB: '0x7065C3dd0a430E542330702C8541FD9bAFd25dC8' as `0x${string}`,
  ETH: '0xba7658877cC1AA6738c2932B0aB1aa01c9904cd8' as `0x${string}`,
  USDC: '0x20C9a9EE7d7634F73558d65686e55495D9BA9F4f' as `0x${string}`,
  WPHRS: '0x2C0D2ff171D0BdA5706e220C14DC116186AB156A' as `0x${string}`,
} as const;

// Token List with metadata
export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  isNative?: boolean;
}

export const TOKEN_LIST: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'PHRS',
    name: 'Pharos',
    decimals: 18,
    logoURI: '/tokens/phrs.png',
    isNative: true,
  },
  {
    address: TOKENS.OCTO,
    symbol: 'OCTO',
    name: 'Octopus Token',
    decimals: 18,
    logoURI: '/tokens/octo.png',
  },
  {
    address: TOKENS.BNB,
    symbol: 'BNB',
    name: 'Binance Coin',
    decimals: 18,
    logoURI: '/tokens/bnb.png',
  },
  {
    address: TOKENS.ETH,
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: '/tokens/eth.png',
  },
  {
    address: TOKENS.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: '/tokens/usdc.png',
  },
];

export const getTokenByAddress = (address: string): Token | undefined => {
  return TOKEN_LIST.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKEN_LIST.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
};
