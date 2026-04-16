"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useStudio } from "../lib/store";
import { formatRelativeTime } from "../lib/constants";
import type { SessionRecord } from "../lib/types";

export default function SessionSwitcher({
  sessions,
  activeKey,
}: {
  sessions: SessionRecord[];
  activeKey?: string;
}) {
  const { newSession, switchSession } = useStudio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeLabel =
    sessions.find((s) => s.key === activeKey)?.label ?? activeKey?.split(":").pop() ?? "DEFAULT";

  return (
    <div ref={ref} className="flex items-center gap-1">
      <button
        type="button"
        className="bg-[#25262B] border border-[#3F4045] rounded px-2 py-1 flex items-center gap-2 text-[10px] text-white hover:border-[#FF7020] transition-all"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate max-w-[100px] uppercase font-bold">{activeLabel}</span>
        <ChevronDown
          size={10}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <button
        type="button"
        className="bg-[#FF7020] text-white p-1.5 rounded hover:brightness-110"
        onClick={() => {
          newSession();
          setOpen(false);
        }}
        title="New session"
      >
        <Plus size={10} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-[#2D2E33] border border-[#3F4045] rounded shadow-xl z-[60] max-h-64 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-3 text-[10px] text-gray-500 italic">No sessions yet</div>
          ) : (
            sessions.map((session) => {
              const isActive = session.key === activeKey;
              return (
                <button
                  key={session.key}
                  type="button"
                  className={`w-full text-left p-3 border-b border-[#3F4045]/50 last:border-none transition-colors ${
                    isActive ? "bg-[#FF7020]/10" : "hover:bg-white/5"
                  }`}
                  onClick={() => {
                    switchSession(session.key);
                    setOpen(false);
                  }}
                >
                  <div className={`text-[10px] uppercase font-bold ${isActive ? "text-[#FF7020]" : "text-white"}`}>
                    {session.label ?? session.key.split(":").pop()}
                  </div>
                  <div className="text-[8px] text-gray-500 mt-0.5">
                    {formatRelativeTime(session.createdAt)}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
