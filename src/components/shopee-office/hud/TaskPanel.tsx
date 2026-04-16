"use client";

import type { TaskItem } from "../lib/types";
import { formatRelativeTime } from "../lib/constants";
import HudFlyout from "./HudFlyout";

function taskStatusLabel(status: TaskItem["status"]) {
  switch (status) {
    case "queued":
      return "queued";
    case "returning":
      return "returning";
    case "submitted":
      return "sending";
    case "stopped":
      return "stopped";
    default:
      return status;
  }
}

export default function TaskPanel({ tasks }: { tasks: TaskItem[] }) {
  const runningTasks = tasks.filter((task) =>
    ["running", "submitted", "queued", "returning"].includes(task.status),
  );

  return (
    <HudFlyout title="Tasks" subtitle={`${runningTasks.length} active / ${tasks.length} total`}>
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">No tasks yet.</div>
        ) : (
          tasks.map((task) => (
            <div key={task.taskId} className="bg-[#25262B] border border-[#3F4045] rounded p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold uppercase tracking-wider hud-status--${task.status}`}>
                  {taskStatusLabel(task.status)}
                </span>
                <span className="text-[8px] text-gray-500">{formatRelativeTime(task.completedAt ?? task.createdAt)}</span>
              </div>
              <div className="text-xs text-white leading-relaxed">{task.message}</div>
            </div>
          ))
        )}
      </div>
    </HudFlyout>
  );
}
