"use client";

import Image from "next/image";

export type HudPanelId = "connection" | "chat" | "tasks" | "workers" | "music";

export interface HudDockItem {
  id: HudPanelId;
  label: string;
  icon: string;
  iconActive: string;
}

interface HudDockProps {
  items: HudDockItem[];
  openPanel: HudPanelId | null;
  onToggle: (id: HudPanelId) => void;
  iconOverrides?: Partial<Record<HudPanelId, string>>;
}

export default function HudDock({ items, openPanel, onToggle, iconOverrides }: HudDockProps) {
  return (
    <div className="layout-topbar__tools">
      {items.map((item) => {
        const active = openPanel === item.id;
        const override = iconOverrides?.[item.id];
        const src = override ?? (active ? item.iconActive : item.icon);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            title={item.label}
            className={`topbar-tool-btn ${active ? "topbar-tool-btn--active" : ""}`}
          >
            <Image
              src={src}
              alt={item.label}
              width={28}
              height={28}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
          </button>
        );
      })}
    </div>
  );
}
