"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStudio } from "../lib/store";
import { gameEvents } from "../lib/events";

export default function TerminalModal() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [targetSeatId, setTargetSeatId] = useState<string | undefined>(undefined);
  const { state, assignTask, prepareSessionForSeat } = useStudio();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isConnected = state.connection === "connected";

  const close = useCallback(() => {
    setOpen(false);
    setTargetSeatId(undefined);
    gameEvents.emit("terminal-closed");
  }, []);

  useEffect(() => {
    const handleOpen = async (seatId?: string) => {
      if (seatId) {
        await prepareSessionForSeat(seatId);
      }
      setTargetSeatId(seatId);
      setOpen(true);
    };
    const unsubOpen = gameEvents.on("open-terminal", (seatId) => {
      void handleOpen(seatId);
    });
    const unsubQueue = gameEvents.on("open-terminal-queue", (seatId) => {
      void handleOpen(seatId);
    });
    return () => {
      unsubOpen();
      unsubQueue();
    };
  }, [prepareSessionForSeat]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, close]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;
    assignTask(trimmed, targetSeatId);
    setInput("");
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 100, background: "rgba(0,0,0,0.6)", pointerEvents: "auto" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="rounded-lg p-6 flex flex-col gap-4"
        style={{
          width: "min(520px, 90vw)",
          background: 'rgba(45,46,51,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #3F4045',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white tracking-widest">{">"} TERMINAL</div>
          <button
            className="text-xs text-gray-400 hover:text-white"
            onClick={close}
          >
            ESC
          </button>
        </div>

        {!isConnected && (
          <div className="text-xs text-red-500 p-2 border border-red-500 rounded bg-red-500/10">
            Not connected. Please connect first.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <textarea
            ref={inputRef}
            placeholder={isConnected ? "Describe task..." : "Connect first..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            className="w-full bg-[#25262B] border border-[#3F4045] rounded p-3 text-white text-sm focus:outline-none focus:border-[#FF7020] min-height-[100px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!isConnected || !input.trim()}
            className="w-full bg-[#FF7020] text-white py-2 rounded font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ASSIGN TASK
          </button>
        </div>
      </div>
    </div>
  );
}
