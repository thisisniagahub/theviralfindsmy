"use client";

import "./hud.css";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useStudio } from "../lib/store";
import { isVisibleChatMessage } from "../lib/constants";
import { MAIN_SESSION_KEY } from "../lib/reducer";
import type { HudDockItem, HudPanelId } from "./HudDock";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";
import TerminalModal from "./TerminalModal";
import ConnectionPanel from "./ConnectionPanel";
import TaskPanel from "./TaskPanel";
import WorkerPanel from "./WorkerPanel";
import ChatPanel from "./ChatPanel";

export default function GameHud() {
  const { state } = useStudio();
  const [openPanel, setOpenPanel] = useState<HudPanelId | null>(null);

  const activeSessionKey = state.activeSessionKey ?? MAIN_SESSION_KEY;
  const visibleTasks = useMemo(
    () => state.tasks.filter((task) => task.sessionKey === activeSessionKey),
    [activeSessionKey, state.tasks],
  );

  const visibleMessages = useMemo(
    () =>
      state.chatMessages.filter(
        (message) => message.sessionKey === activeSessionKey && isVisibleChatMessage(message),
      ),
    [activeSessionKey, state.chatMessages],
  );
  
  const toolItems: HudDockItem[] = useMemo(
    () => [
      {
        id: "connection",
        label: "Connection",
        icon: "/shopee-office/btn-state-sprite.png",
        iconActive: "/shopee-office/btn-state-sprite.png",
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: "/shopee-office/btn-open-drawer-sprite.png",
        iconActive: "/shopee-office/btn-open-drawer-sprite.png",
      },
      {
        id: "workers",
        label: "Team",
        icon: "/shopee-office/guest_role_1.png",
        iconActive: "/shopee-office/guest_role_1.png",
      },
    ],
    [],
  );

  const togglePanel = useCallback((id: HudPanelId) => {
    setOpenPanel((current) => (current === id ? null : id));
  }, []);

  const topRightPanelOpen = openPanel && openPanel !== "chat";

  return (
    <div className="hud-overlay">
      <TopBar
        seats={state.seats}
        toolItems={toolItems}
        openPanel={openPanel}
        onToggle={togglePanel}
      />

      {topRightPanelOpen && (
        <div className="hud-topright-flyout">
          {openPanel === "connection" ? <ConnectionPanel /> : null}
          {openPanel === "tasks" ? <TaskPanel tasks={visibleTasks} /> : null}
          {openPanel === "workers" ? (
            <WorkerPanel seats={state.seats} onOpenManager={() => {}} />
          ) : null}
        </div>
      )}

      <TerminalModal />

      <div className="layout-bottom">
        <BottomBar
          connection={state.connection}
          sessionMetrics={state.sessionMetrics}
          seats={state.seats}
        />

        <div style={{ flex: "1 1 auto" }} />

        <div className="hud-chat-dock">
          {openPanel === "chat" && (
            <div className="mb-2">
              <ChatPanel
                messages={visibleMessages}
                tasks={visibleTasks}
                isConnected={state.connection === "connected"}
                sessions={state.sessions}
                activeSessionKey={state.activeSessionKey}
              />
            </div>
          )}
          <button
            type="button"
            className={`hud-chat-dock__btn ${openPanel === "chat" ? "hud-chat-dock__btn--active" : ""}`}
            onClick={() => togglePanel("chat")}
            title="Chat"
          >
            <span className="hud-chat-dock__label">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
