"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { robinhoodTestnet } from "./chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const connectors = [
  // Keep a generic EIP-1193 fallback and let wagmi discover named EIP-6963 wallets.
  injected({ shimDisconnect: true }),
  ...(projectId ? [walletConnect({ projectId, showQrModal: true })] : []),
];

// Module singleton: avoid recreating transport and connector state on renders.
export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  connectors,
  multiInjectedProviderDiscovery: true,
  transports: { [robinhoodTestnet.id]: http("https://rpc.testnet.chain.robinhood.com") },
  ssr: true,
});

export function WalletProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}