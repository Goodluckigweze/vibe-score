import { defineChain } from "viem";

// Robinhood Chain Testnet ERC-20 token used for holder gating.
export const GATING_TOKEN_ADDRESS: `0x${string}` = "0x249BD2ee766704C280373e17f9e52e0995ACe917";
// Add only verified Vibe-related contracts here. The configured gate token is checked automatically.
export const RELATED_VIBE_CONTRACTS: readonly `0x${string}`[] = [];

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Robinhood", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Robinhood Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

export const isGateUnconfigured =
  GATING_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000";