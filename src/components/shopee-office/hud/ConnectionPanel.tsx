"use client";

import { useState } from "react";
import { useStudio } from "../lib/store";
import { LS_CONFIG, STATUS_LABELS } from "../lib/constants";
import { parseGatewayAddress, getAgentProvider } from "../lib/utils";
import HudFlyout from "./HudFlyout";

const DEFAULT_GATEWAY = "ws://operator.gangniaga.my";
const DEFAULT_TOKEN = process.env.NEXT_PUBLIC_GATEWAY_TOKEN ?? "";
const IS_AUGGIE = getAgentProvider() === "auggie";

function loadSavedConfig(): { url: string; token: string } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LS_CONFIG) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { url?: string; token?: string };
      return {
        url: parsed.url || DEFAULT_GATEWAY,
        token: parsed.token || DEFAULT_TOKEN,
      };
    }
  } catch {}
  return { url: DEFAULT_GATEWAY, token: DEFAULT_TOKEN };
}

export default function ConnectionPanel() {
  const { state, connect, disconnect } = useStudio();
  const [url, setUrl] = useState(() => loadSavedConfig().url);
  const [token, setToken] = useState(() => loadSavedConfig().token);
  const isConnected = state.connection === "connected";
  const isConnecting = state.connection === "connecting";
  const isAuthFailed = state.connection === "auth_failed";
  const isUnreachable = state.connection === "unreachable";
  const isRateLimited = state.connection === "rate_limited";

  const [error, setError] = useState("");

  const handleConnect = () => {
    setError("");
    const parsed = parseGatewayAddress(url);
    if (!parsed) {
      setError("Invalid URL. Use ws://host:port or host:port.");
      return;
    }
    connect({ url: parsed, token: token.trim() });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      handleConnect();
    }
  };

  return (
    <HudFlyout
      title="Connection"
      subtitle={`${STATUS_LABELS[state.connection]} gateway link`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Gateway URL</label>
          <input
            className="bg-[#25262B] border border-[#3F4045] rounded p-2 text-white text-xs focus:outline-none focus:border-[#FF7020]"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="ws://operator.gangniaga.my"
            disabled={isConnected || isConnecting}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Token</label>
          <input
            className="bg-[#25262B] border border-[#3F4045] rounded p-2 text-white text-xs focus:outline-none focus:border-[#FF7020]"
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="optional"
            disabled={isConnected || isConnecting}
          />
        </div>
        
        {isAuthFailed && !error && (
          <p className="text-[10px] text-red-500">
            Authentication failed. Token may be invalid or expired.
          </p>
        )}
        {isUnreachable && !error && (
          <p className="text-[10px] text-red-500">
            Gateway is unreachable. Please check if your gateway is running.
          </p>
        )}
        {error && <p className="text-[10px] text-red-500">{error}</p>}
        
        {!isConnected && !isConnecting ? (
          <button
            type="button"
            className="bg-[#FF7020] text-white py-2 rounded font-bold text-xs hover:brightness-110"
            onClick={handleConnect}
            disabled={!url.trim()}
          >
            Connect
          </button>
        ) : null}
        {isConnected ? (
          <button type="button" className="bg-[#3F4045] text-white py-2 rounded font-bold text-xs" onClick={disconnect}>
            Disconnect
          </button>
        ) : null}
        {isConnecting ? (
          <button type="button" className="bg-[#3F4045] text-white py-2 rounded font-bold text-xs" onClick={disconnect}>
            Cancel
          </button>
        ) : null}
      </div>
    </HudFlyout>
  );
}
