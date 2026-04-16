"use client";

import { Square } from "lucide-react";
import type { ChatMessage } from "../lib/types";
import ToolBubble from "./ToolBubble";

export default function MessageBubble({
  msg,
  actorName,
  canStop,
  onStop,
}: {
  msg: ChatMessage;
  actorName?: string;
  canStop?: boolean;
  onStop?: () => void;
}) {
  if (msg.role === "system") {
    return <div className="text-[10px] text-gray-500 italic py-1 border-b border-[#3F4045]/30 mb-2">{msg.content}</div>;
  }

  if (msg.role === "tool") {
    return <div className="mb-2"><ToolBubble msg={msg} /></div>;
  }

  const handleStop = () => {
    if (onStop) onStop();
  };

  return (
    <div
      className={`rounded-lg p-3 text-xs leading-relaxed mb-2 flex flex-col gap-1 ${
        msg.role === "user" ? "bg-[#FF7020]/10 border border-[#FF7020]/30 ml-4" : "bg-[#25262B] border border-[#3F4045] mr-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-bold text-[#FF7020] uppercase tracking-wider">
          {msg.role === "user" ? "YOU" : (msg.actorName ?? actorName ?? "ASSISTANT")}
        </div>
        {canStop && msg.role === "user" && (
          <button
            type="button"
            className="text-red-500 hover:text-red-400"
            onClick={handleStop}
            title="Stop task"
          >
            <Square size={10} fill="currentColor" />
          </button>
        )}
      </div>
      <div className="text-white">
        {msg.content}
        {msg.streaming ? <span className="animate-pulse">▌</span> : null}
      </div>
    </div>
  );
}
