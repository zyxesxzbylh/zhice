"use client";

import { getDateKey } from "@/lib/task-helpers";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  dueDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  isDaily: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project: string | null;
  isSop: boolean;
  parentTaskId: string | null;
}

interface TaskYearViewProps {
  tasksByDate: Record<string, Task[]>;
  year: number;
  onDateClick: (date: Date, timeRange: string) => void;
}

export default function TaskYearView({
  tasksByDate,
  year,
  onDateClick,
}: TaskYearViewProps) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const today = new Date();
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: 'var(--bg-root)' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {months.map((month, mi) => {
          const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          const firstDay = month.getDay();
          const offset = firstDay === 0 ? 6 : firstDay - 1;
          const days = Array.from({ length: daysInMonth }, (_, i) =>
            new Date(month.getFullYear(), month.getMonth(), i + 1)
          );
          return (
            <div key={mi} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{month.getMonth() + 1}月</div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {weekDays.map((wd, i) => (
                  <div key={i} className="text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>{wd}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: offset }).map((_, i) => (
                  <div key={`e-${i}`}></div>
                ))}
                {days.map((d, i) => {
                  const dayTasks = tasksByDate[getDateKey(d)] || [];
                  const isToday = getDateKey(d) === getDateKey(today);
                  const hasTasks = dayTasks.length > 0;
                  return (
                    <div key={i} onClick={() => onDateClick(d, "day")}
                      className="text-center text-[9px] py-0.5 rounded cursor-pointer transition-colors"
                      style={{
                        color: isToday ? 'var(--text-primary)' : hasTasks ? 'var(--text-secondary)' : 'var(--text-muted)',
                        fontWeight: isToday ? 'bold' : 'normal',
                        backgroundColor: isToday ? 'var(--bg-muted)' : hasTasks ? 'var(--bg-root)' : 'transparent',
                      }}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
