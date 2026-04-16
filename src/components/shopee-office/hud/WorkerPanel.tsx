"use client";

import type { SeatState } from "../lib/types";
import HudFlyout from "./HudFlyout";

function seatStatusLabel(seat: SeatState) {
  if (!seat.assigned) return "vacant";
  if (seat.status === "empty") return "idle";
  return seat.status;
}

function SeatGroup({ title, seats }: { title: string; seats: SeatState[] }) {
  if (seats.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b border-[#3F4045]/50 pb-1">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {seats.map((seat) => (
          <div key={seat.seatId} className="bg-[#25262B] border border-[#3F4045] rounded p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-bold uppercase hud-status--${seat.status}`}>
                {seatStatusLabel(seat)}
              </span>
              <span className="text-[10px] font-bold text-white">
                {seat.assigned ? seat.label : "Vacant Seat"}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 leading-tight">
              {seat.assigned
                ? (seat.taskSnippet ??
                  `${seat.roleTitle ?? (seat.seatType === "agent" ? "Agent" : "Worker")} waiting at desk`)
                : "Assign a crew member to this seat"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkerPanel({
  seats,
  onOpenManager,
}: {
  seats: SeatState[];
  onOpenManager: () => void;
}) {
  const assigned = seats.filter((s) => s.assigned).length;
  const working = seats.filter(
    (s) => s.assigned && (s.status === "running" || s.status === "returning"),
  ).length;
  const agentSeats = seats.filter((s) => s.seatType === "agent");
  const workerSeats = seats.filter((s) => s.seatType !== "agent");

  return (
    <HudFlyout
      title="Team"
      subtitle={`${working}/${assigned} busy · ${assigned}/${seats.length} total`}
      headerAction={
        <button
          type="button"
          className="bg-[#FF7020] text-white px-2 py-1 rounded text-[8px] font-bold uppercase hover:brightness-110"
          onClick={onOpenManager}
        >
          Manage
        </button>
      }
    >
      <div className="max-h-[400px] overflow-y-auto pr-1">
        <SeatGroup title={`OpenClaw Agents (${agentSeats.length})`} seats={agentSeats} />
        <SeatGroup title={`Office Workers (${workerSeats.length})`} seats={workerSeats} />
      </div>
    </HudFlyout>
  );
}
