"use client";

import { useState } from "react";
import type { ToolChatMessage } from "../lib/types";

function parseToolParts(msg: ToolChatMessage): { summary: string; detail: string | null } {
  let summary = msg.toolName;
  if (msg.toolInput) {
    try {
      const parsed = JSON.parse(msg.toolInput);
      const hint =
        parsed.command ??
        parsed.path ??
        parsed.filename ??
        parsed.pattern ??
        parsed.query ??
        parsed.url;
      if (typeof hint === "string") {
        const short = hint.length > 60 ? hint.slice(0, 57) + "..." : hint;
        summary = `${msg.toolName}  ${short}`;
      }
    } catch {}
  }
  return { summary, detail: msg.toolOutput ?? null };
}

export default function ToolBubble({ msg }: { msg: ToolChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const { summary, detail } = parseToolParts(msg);

  return (
    <div className="bg-[#4ade80]/10 border border-[#4ade80]/40 rounded p-2 text-xs">
      <div className="flex justify-between items-start gap-2">
        <div className="text-[9px] font-bold text-[#4ade80] uppercase">{summary}</div>
        {detail && (
          <button
            type="button"
            className="text-[8px] text-gray-500 hover:text-white underline uppercase"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "hide" : "show"}
          </button>
        )}
      </div>
      {expanded && detail && (
        <div className="mt-2 text-[10px] text-green-200 font-mono whitespace-pre-wrap break-all border-t border-[#4ade80]/20 pt-2">
          {detail}
        </div>
      )}
    </div>
  );
}
