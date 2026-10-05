"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { formatUnits, isAddress, parseAbi } from "viem";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { robinhoodTestnet, GATING_TOKEN_ADDRESS, RELATED_VIBE_CONTRACTS, isGateUnconfigured } from "./chain";
import { rankFor, scoreFrom, signaturePoints, vibeSignature, type ScoreParts } from "./scoring";

type Phase = "disconnected" | "connecting" | "switching" | "verifying" | "locked" | "unlocked" | "error";
type Details = { balance: string; txCount: number; txLabel: string; signature: string; parts: ScoreParts };
const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);
const EXPLORER_API = "https://explorer.testnet.chain.robinhood.com/api/v2";

function shortAddress(value?: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "";
}

export default function HomePage() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [phase, setPhase] = useState<Phase>("disconnected");
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const [switchRejected, setSwitchRejected] = useState(false);
  const [pendingConnectorUid, setPendingConnectorUid] = useState<string | null>(null);
  const connectStarted = useRef(false);
  const currentChain = chainId === robinhoodTestnet.id;

  const loadWallet = useCallback(async () => {
    if (!address || !currentChain) return;
    setError("");
    if (isGateUnconfigured) {
      setDetails(null);
      setPhase("verifying");
      return;
    }
    if (!isAddress(GATING_TOKEN_ADDRESS) || GATING_TOKEN_ADDRESS.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      setError("The configured gating token address is invalid. Update GATING_TOKEN_ADDRESS and retry.");
      setPhase("error");
      return;
    }
    setPhase("verifying");
    setDetails(null);
    try {
      const { createPublicClient, http } = await import("viem");
      const client = createPublicClient({ chain: robinhoodTestnet, transport: http("https://rpc.testnet.chain.robinhood.com") });
      const tokenAddress = GATING_TOKEN_ADDRESS as `0x${string}`;
      const [rawBalance, decimals] = await Promise.all([
        client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      ]);
      if (rawBalance === 0n) {
        setPhase("locked");
        return;
      }
      const balance = formatUnits(rawBalance, decimals);

      let txCount = 0;
      let txLabel = "Indexed transaction count";
      try {
        const response = await fetch(`${EXPLORER_API}/addresses/${address}/counters`, { cache: "no-store" });
        if (!response.ok) throw new Error("Explorer counters unavailable");
        const counters = await response.json();
        const parsed = Number.parseInt(String(counters.transactions_count), 10);
        if (!Number.isFinite(parsed)) throw new Error("Explorer counter unavailable");
        txCount = parsed;
      } catch {
        txCount = await client.getTransactionCount({ address });
        txLabel = "Outgoing nonce (approx.)";
      }

      let interactions = 0;
      const knownContracts = Array.from(new Set(
        [GATING_TOKEN_ADDRESS as `0x${string}`, ...RELATED_VIBE_CONTRACTS]
          .filter((contract) => contract.toLowerCase() !== "0x0000000000000000000000000000000000000000")
          .map((contract) => contract.toLowerCase()),
      ));
      if (knownContracts.length > 0) {
        try {
          const [transactionsResponse, transfersResponse] = await Promise.all([
            fetch(`${EXPLORER_API}/addresses/${address}/transactions`, { cache: "no-store" }),
            fetch(`${EXPLORER_API}/addresses/${address}/token-transfers`, { cache: "no-store" }),
          ]);
          let touched = false;
          if (transactionsResponse.ok) {
            const data = await transactionsResponse.json();
            touched = (data.items ?? []).some((tx: { to?: { hash?: string } | string }) => {
              const to = typeof tx.to === "string" ? tx.to : tx.to?.hash;
              return Boolean(to && knownContracts.includes(to.toLowerCase()));
            });
          }
          if (!touched && transfersResponse.ok) {
            const data = await transfersResponse.json();
            touched = (data.items ?? []).some((transfer: { token?: { address?: string | { hash?: string } } }) => {
              const tokenAddress = typeof transfer.token?.address === "string"
                ? transfer.token.address
                : transfer.token?.address?.hash;
              return Boolean(tokenAddress && knownContracts.includes(tokenAddress.toLowerCase()));
            });
          }
          interactions = touched ? 15 : 0;
        } catch {
          interactions = 0;
        }
      }
      const parts: ScoreParts = {
        balance: Math.min(30, Math.round((Math.log1p(Number(balance)) / Math.log1p(1000)) * 30)),
        activity: Math.min(40, Math.round((Math.log1p(txCount) / Math.log1p(500)) * 40)),
        interactions,
        signature: signaturePoints(address),
      };
      setDetails({ balance, txCount, txLabel, signature: vibeSignature(address), parts });
      setPhase("unlocked");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify this wallet against the testnet RPC.");
      setPhase("error");
    }
  }, [address, currentChain]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPhase("disconnected");
      setDetails(null);
      return;
    }
    if (!currentChain) {
      setPhase("switching");
      setDetails(null);
      return;
    }
    void loadWallet();
  }, [isConnected, address, currentChain, loadWallet]);

  useEffect(() => {
    if (isConnected && !currentChain && !connectStarted.current) {
      connectStarted.current = true;
      void switchChainAsync({ chainId: robinhoodTestnet.id })
        .then(() => setSwitchRejected(false))
        .catch(() => setSwitchRejected(true));
    }
    if (!isConnected) connectStarted.current = false;
  }, [isConnected, currentChain, switchChainAsync]);

  const connectWallet = (id: string) => {
    setError("");
    setPhase("connecting");
    const target = connectors.find((item) => item.uid === id);
    if (!target) {
      setError("This wallet connector is not available in this browser.");
      setPhase("error");
      return;
    }
    setPendingConnectorUid(id);
    connect({ connector: target, chainId: robinhoodTestnet.id }, {
      onError: (cause) => {
        setError(cause.message || "Wallet connection was not completed.");
        setPendingConnectorUid(null);
        setPhase("error");
      },
      onSuccess: () => setPendingConnectorUid(null),
    });
  };
  const retrySwitch = async () => {
    setSwitchRejected(false);
    try { await switchChainAsync({ chainId: robinhoodTestnet.id }); }
    catch { setSwitchRejected(true); }
  };
  const score = details ? scoreFrom(details.parts) : 0;
  const rank = rankFor(score);
  const walletConnectConnector = connectors.find((item) => item.id === "walletConnect");
  const discoveredWalletConnectors = connectors.filter(
    (item) => item.id !== "walletConnect" && item.id !== "injected",
  );
  const injectedFallback = connectors.find((item) => item.id === "injected");
  const walletOptions = [
    ...discoveredWalletConnectors,
    ...(injectedFallback ? [injectedFallback] : []),
  ];
  const rpcExplorer = "https://explorer.testnet.chain.robinhood.com";

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" /><div className="ambient ambient-b" />
      <div className="wrap">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Vibe Score home">
            <span className="brand-mark">V</span><span>vibe score</span><small>TESTNET</small>
          </a>
          <div className="network-pill"><span className="live-dot" /> Robinhood Chain <span style={{ color: "#6d857a" }}>·</span> 46630</div>
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow">Your chain, your character</div>
            <h1>Every wallet<br />has a <em>vibe.</em></h1>
            <p className="lede">A reputation card shaped by your on-chain presence. Connect on Robinhood Chain Testnet and see what your wallet says about you.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <span className="orbit-label one">ON-CHAIN IDENTITY</span><span className="orbit-label two">NOT A FINANCIAL SCORE</span>
            <div className="score-emblem"><div className="emblem-number">V.</div><div className="emblem-caption">VIBE INDEX</div></div>
          </div>
        </section>

        <section className="content-grid" aria-label="Wallet vibe score">
          <div className="panel main-panel" aria-live="polite">
            <div className="panel-head">
              <div><div className="section-label">Wallet readout</div><h2 className="panel-title">Your Vibe Score</h2></div>
              <span className="status-badge"><span className="live-dot" /> {phase === "unlocked" ? "SIGNAL FOUND" : isConnected ? "WALLET LINKED" : "AWAITING WALLET"}</span>
            </div>

            {phase === "disconnected" && (
              <>
                <div className="connect-content">
                  <p className="connect-copy">No two wallets leave the same footprint. Connect yours to reveal a score built from real testnet signals, not a quiz.</p>
                  <div className="wallet-options" aria-label="Choose a wallet">
                    {walletOptions.map((wallet, index) => {
                      const walletName = wallet.id === "injected" ? "browser wallet" : wallet.name;
                      const isThisWalletConnecting = isConnecting && pendingConnectorUid === wallet.uid;
                      return (
                        <button
                          key={wallet.uid}
                          className={index === 0 ? "primary-button" : "secondary-button"}
                          disabled={isConnecting}
                          onClick={() => connectWallet(wallet.uid)}
                        >
                          {isThisWalletConnecting ? `Connecting to ${walletName}` : `Connect ${walletName}`}
                          <span className="arrow">↗</span>
                        </button>
                      );
                    })}
                    {walletConnectConnector && (
                      <button
                        className="secondary-button"
                        disabled={isConnecting}
                        onClick={() => connectWallet(walletConnectConnector.uid)}
                      >
                        {isConnecting && pendingConnectorUid === walletConnectConnector.uid
                          ? "Opening WalletConnect…"
                          : "Connect with WalletConnect"}
                        <span className="arrow">↗</span>
                      </button>
                    )}
                  </div>
                </div>
                {connectError && <div className="state-box error-box"><div className="alert-title">Wallet connection didn’t finish</div><p>{connectError.message}</p></div>}
                <div className="wallet-chip">
                  <span>WALLETS</span>
                  <span className="wallet-address">{discoveredWalletConnectors.length ? `${discoveredWalletConnectors.length} detected` : "Browser wallet support"}</span>
                </div>
                {!walletConnectConnector && (
                  <p className="wallet-connect-note">Wallets opened from another app can connect with WalletConnect. Add a WalletConnect project ID to enable universal pairing.</p>
                )}
              </>
            )}

            {(phase === "connecting" || phase === "verifying") && (
              <div className="state-box">
                <div className="section-label">{phase === "connecting" ? "Connection in progress" : "Reading wallet signals"}</div>
                <p>{phase === "connecting" ? "Approve the connection in your wallet. We’ll check the testnet network and holder gate next." : "Checking the configured gate token and pulling on-chain activity. This can take a moment."}</p>
                <div className="loading-skeleton" role="status" aria-label="Loading wallet score" />
              </div>
            )}

            {phase === "switching" && (
              <div className="state-box alert-box">
                <div className="alert-title">{isSwitching ? "Switching to Robinhood Chain Testnet…" : "Wrong network"}</div>
                <p>Vibe Score reads only Robinhood Chain Testnet (chain ID 46630). Approve the network switch in your wallet to continue.</p>
                {switchRejected && <p>The wallet declined or could not switch automatically. You can retry, or add Robinhood Chain Testnet in your wallet and try again.</p>}
                <div className="retry-row"><button className="secondary-button" onClick={retrySwitch} disabled={isSwitching}>Retry network switch <span className="arrow">↻</span></button></div>
              </div>
            )}

            {phase === "verifying" && isGateUnconfigured && (
              <div className="state-box alert-box">
                <div className="alert-title">Holder gate needs its token address</div>
                <p>The gating contract is still the zero-address placeholder. Configure the real ERC-20 token contract before holder verification can run. No balance call is made until it is configured.</p>
                <div className="placeholder-address">GATING_TOKEN_ADDRESS: {GATING_TOKEN_ADDRESS}</div>
              </div>
            )}

            {phase === "locked" && (
              <div className="state-box alert-box">
                <div className="alert-title">Hold the token to unlock your Vibe Score</div>
                <p>Your connected wallet has no balance of the configured gate token. Hold a nonzero balance and retry the check.</p>
                <div className="retry-row"><button className="secondary-button" onClick={() => void loadWallet()}>Check again <span className="arrow">↻</span></button></div>
              </div>
            )}

            {phase === "error" && (
              <div className="state-box error-box">
                <div className="alert-title">Couldn’t finish the wallet read</div>
                <p>{error || "The testnet RPC or explorer could not be reached."} Check your connection and try again.</p>
                <div className="retry-row"><button className="secondary-button" onClick={() => void loadWallet()}>Retry wallet read <span className="arrow">↻</span></button></div>
              </div>
            )}

            {phase === "unlocked" && details && (
              <>
                <div className="score-layout">
                  <div className="score-ring" style={{ "--score-angle": `${score * 3.6}deg` } as CSSProperties}>
                    <div className="score-value">{score}<small>OUT OF 100</small></div>
                  </div>
                  <div>
                    <div className="section-label">Your signature reads</div>
                    <h3 className="rank-title">{rank.name}</h3>
                    <p className="rank-desc">{rank.description}</p>
                    <div className="stat-row">
                      <div className="stat"><strong>{Number(details.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong><span>Gate tokens</span></div>
                      <div className="stat"><strong>{details.txCount.toLocaleString()}</strong><span>Tx signal</span></div>
                      <div className="stat"><strong>{details.signature}</strong><span>Vibe signature</span></div>
                    </div>
                  </div>
                </div>
                <div className="breakdown">
                  <div className="breakdown-head"><span>Score signals</span><span>Points earned</span></div>
                  {([
                    ["Token balance", details.parts.balance, 30],
                    [details.txLabel, details.parts.activity, 40],
                    ["Known vibe contracts", details.parts.interactions, 15],
                    ["Wallet signature", details.parts.signature, 15],
                  ] as [string, number, number][]).map(([label, points, max]) => (
                    <div className="score-line" key={label}>
                      <div>
                        <div className="score-line-label"><span>{label}</span><small>{points} / {max}</small></div>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${(points / max) * 100}%` }} /></div>
                      </div>
                      <div className="score-line-points">+{points}</div>
                    </div>
                  ))}
                  <p className="muted-small">Activity uses the testnet explorer’s indexed transaction counter when available; otherwise it uses your outgoing nonce as an approximation. Contract interaction checks, if configured, inspect indexed recent transactions only—not full wallet history.</p>
                </div>
                <div className="wallet-chip"><span>CONNECTED VIA {connector?.name?.toUpperCase() ?? "WALLET"}</span><button className="secondary-button" onClick={() => { disconnect(); setDetails(null); }}>Disconnect</button></div>
              </>
            )}
          </div>

          <aside className="panel side-panel">
            <div className="section-label">How the signal works</div>
            <h2 className="panel-title">A score with receipts.</h2>
            <ul className="how-list">
              <li><span className="step">01</span><span><strong>Prove you’re in.</strong><br />A live ERC-20 balance check gates the readout.</span></li>
              <li><span className="step">02</span><span><strong>Read the footprint.</strong><br />Balance and transaction activity shape up to 70 points.</span></li>
              <li><span className="step">03</span><span><strong>Find your signature.</strong><br />A deterministic address signal adds a little individuality.</span></li>
            </ul>
            <div className="network-note">Vibe Score is an on-chain personality snapshot, not a financial rating. Testnet activity and explorer indexing can be incomplete.</div>
            <div className="network-note" style={{ marginTop: 9 }}>Connected wallet: <strong style={{ color: "#c5dacf" }}>{isConnected ? shortAddress(address) : "Not connected"}</strong>{isConnected && <><br />{currentChain ? "Robinhood Chain Testnet" : "Switch to chain ID 46630 to continue."}</>}</div>
          </aside>
        </section>

        <footer className="footer">
          <span>VIBE SCORE · ROBINHOOD CHAIN TESTNET</span>
          <a href={rpcExplorer} target="_blank" rel="noreferrer">Open testnet explorer ↗</a>
        </footer>
      </div>
    </main>
  );
}