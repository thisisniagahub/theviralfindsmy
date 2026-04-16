import type { SeatState } from "./types";
import { createLogger } from "./logger";

// We need a minimal SeatDef to avoid importing from Phaser utils here
export interface SeatDef {
  seatId: string;
  x: number;
  y: number;
  facing: "right" | "up" | "left" | "down";
}

const log = createLogger("GameEventBus");

export interface GameEventMap {
  "seats-discovered": [seats: SeatDef[]];
  "seat-configs-updated": [seats: SeatState[]];
  "task-assigned": [taskId: string, message: string, seatId?: string, sessionKey?: string];
  "task-routed": [taskId: string, seatId: string, actorName: string];
  "task-ready": [taskId: string, message: string, seatId?: string];
  "task-bound": [taskId: string, runId: string];
  "task-staged": [taskId: string, stage: "queued" | "returning", seatId?: string];
  "task-bubble": [runId: string, text: string, ttl: number];
  "task-aborted": [runId: string];
  "task-completed": [runId: string];
  "task-failed": [runId: string];
  "subagent-assigned": [runId: string, parentRunId: string, label: string, seatId?: string];
  "open-terminal": [seatId?: string];
  "open-terminal-queue": [seatId: string];
  "stop-task": [runId: string, seatId: string];
  "terminal-closed": [];
  "new-session-for-seat": [seatId: string];
  "open-session-history": [seatId: string];
  "agent-selected": [agentId: string]; // Added for Shopee compatibility
  "agent-status-changed": [agentId: string, status: string]; // Added for Shopee compatibility
}

type Listener<T extends unknown[]> = (...args: T) => void;

class GameEventBus {
  private listeners = new Map<string, Set<Listener<unknown[]>>>();

  on<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn as Listener<unknown[]>);
    return () => this.off(event, fn);
  }

  off<K extends keyof GameEventMap>(event: K, fn: Listener<GameEventMap[K]>) {
    this.listeners.get(event)?.delete(fn as Listener<unknown[]>);
  }

  emit<K extends keyof GameEventMap>(event: K, ...args: GameEventMap[K]) {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (err) {
        log.error(`listener error on "${event}":`, err);
      }
    });
  }
}

export const gameEvents = new GameEventBus();
