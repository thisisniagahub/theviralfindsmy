import type { AgentProvider } from "./types";

/**
 * Returns the configured agent provider.
 * Set via NEXT_PUBLIC_AGENT_PROVIDER env var (available client-side).
 */
export function getAgentProvider(): AgentProvider {
  const val = process.env.NEXT_PUBLIC_AGENT_PROVIDER;
  if (val === "auggie") return "auggie";
  return "openclaw";
}

export function getDefaultGatewayUrl() {
  if (process.env.NEXT_PUBLIC_GATEWAY_URL) {
    return process.env.NEXT_PUBLIC_GATEWAY_URL;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/gateway`;
  }

  return "ws://localhost:3000/api/gateway";
}

/**
 * Parse a user-friendly gateway address into a full WebSocket URL.
 */
export function parseGatewayAddress(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return getDefaultGatewayUrl();
  if (/^wss?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `ws://${trimmed}${trimmed.endsWith("/") ? "" : "/"}`;
  }
  return null;
}
