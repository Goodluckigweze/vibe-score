import { keccak256, stringToBytes } from "viem";

export type ScoreParts = {
  balance: number;
  activity: number;
  interactions: number;
  signature: number;
};

export function signaturePoints(address: string) {
  const hash = keccak256(stringToBytes(address.toLowerCase()));
  return Number(BigInt(hash) % 16n);
}

export function vibeSignature(address: string) {
  const hash = keccak256(stringToBytes(address.toLowerCase()));
  return `VIBE-${hash.slice(2, 8).toUpperCase()}`;
}

export function scoreFrom(parts: ScoreParts) {
  return Math.min(100, Math.max(0, parts.balance + parts.activity + parts.interactions + parts.signature));
}

export function rankFor(score: number) {
  if (score < 20) return { name: "Low Vibe", description: "A fresh wallet, just finding its rhythm." };
  if (score < 40) return { name: "Chill Vibe", description: "A little activity, with room to roam." };
  if (score < 60) return { name: "Solid Vibe", description: "A steady presence on the chain." };
  if (score < 75) return { name: "High Vibe", description: "You’re making your moves count." };
  if (score < 90) return { name: "Elite Vibe", description: "A distinct on-chain signature is taking shape." };
  return { name: "Legendary Vibe", description: "The chain has seen a wallet with real character." };
}