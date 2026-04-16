"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useStudio } from "../lib/store";
import { gameEvents } from "../lib/events";
import type { ChatMessage, SessionRecord, TaskItem } from "../lib/types";
import { findTask } from "../lib/reducer";
import HudFlyout from "./HudFlyout";
import MessageBubble from "./MessageBubble";
import SessionSwitcher from "./SessionSwitcher";

export default function ChatPanel({
  messages,
  tasks,
  isConnected,
  sessions,
  activeSessionKey,
}: {
  messages: ChatMessage[];
  tasks: TaskItem[];
  isConnected: boolean;
  sessions: SessionRecord[];
  activeSessionKey?: string;
}) {
  const { assignTask } = useStudio();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const actorByRunId = useMemo(() => {
    const map = new Map<string, string>();
    for (const task of tasks) {
      if (!task.actorName) continue;
      if (task.runId) map.set(task.runId, task.actorName);
      map.set(task.taskId, task.actorName);
    }
    return map;
  }, [tasks]);

  const stopHandler = useCallback((runId: string, seatId: string) => {
    gameEvents.emit("stop-task", runId, seatId);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;
    assignTask(trimmed);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <HudFlyout
      title="Chat"
      subtitle={isConnected ? "Send messages and view execution" : "Connect to start"}
      headerAction={<SessionSwitcher sessions={sessions} activeKey={activeSessionKey} />}
    >
      <div className="flex flex-col h-[400px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 mb-4 flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 italic">
              No conversation yet. Type a message to begin.
            </div>
          ) : (
            messages.map((message) => {
              const task = findTask(tasks, message.runId);
              const canStop = task?.status === "running" && (task.runId ?? task.taskId);
              return (
                <MessageBubble
                  key={message.id}
                  msg={message}
                  actorName={actorByRunId.get(message.runId)}
                  canStop={!!canStop}
                  onStop={
                    canStop
                      ? () => stopHandler(task.runId ?? task.taskId, task.seatId ?? "")
                      : undefined
                  }
                />
              );
            })
          )}
        </div>

        <div className="flex gap-2 items-end border-t border-[#3F4045] pt-4">
          <textarea
            ref={inputRef}
            className="flex-1 bg-[#25262B] border border-[#3F4045] rounded p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF7020] min-h-[40px] max-h-[120px] resize-none"
            placeholder={isConnected ? "Type a message..." : "Connect first..."}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
          />
          <button
            type="button"
            className="bg-[#FF7020] text-white p-2 rounded hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>
    </HudFlyout>
  );
}
