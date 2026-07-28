"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { batchUpdateTasks } from "@/lib/api";

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

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  refreshTasks: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  /**
   * Optimistic bulk update — applies the changes locally first, then
   * fires the batch update on the server. The caller does not need to
   * `refreshTasks` afterwards unless they want a full re-sync.
   */
  batchUpdateTasks: (ids: string[], updates: Partial<Task>) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);

  const fetchTasks = useCallback(async (forceLoading = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (forceLoading) setLoading(true);

    try {
      const res = await fetch("/api/tasks", { signal: abortControllerRef.current!.signal });
      if (res.ok) {
        const data = await res.json();
        setTasks(
          data
            .map((t: any) => ({
              id: t.id,
              title: String(t.title ?? ""),
              description: t.description != null ? String(t.description) : null,
              status: t.status as TaskStatus,
              priority:
                (t.priority === "high"
                  ? 1
                  : t.priority === "low"
                  ? 3
                  : t.priority === "urgent"
                  ? 1
                  : 2) as 1 | 2 | 3,
              dueDate: t.dueDate ? new Date(t.dueDate) : null,
              startTime: t.startTime || null,
              endTime: t.endTime || null,
              completedAt: t.completedAt || null,
              isDaily: false,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              projectId: t.projectId || null,
              project:
                typeof t.project === "string"
                  ? t.project
                  : t.project?.name != null
                  ? String(t.project.name)
                  : null,
              isSop: !!t.isSop,
              parentTaskId: t.parentTaskId || null,
            }))
            .filter((t: Task) => t.id && t.title),
        );
      } else {
        setTasks([]);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setTasks([]);
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(true);

    let visible = true;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !visible) {
        visible = true;
        fetchTasks();
      } else if (document.visibilityState === "hidden") {
        visible = false;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onFocus = () => {
      fetchTasks();
    };
    window.addEventListener("focus", onFocus);

    // Polling: 60s instead of 30s — halves the number of background
    // fetches and is fine-grained enough for the scheduler UX. Visibility
    // and focus events still trigger immediate refreshes when the user
    // comes back, so the slower timer doesn't hurt perceived freshness.
    const interval = window.setInterval(() => {
      // Skip the timer-driven refresh while the tab is hidden — the
      // visibilitychange handler will refresh the moment it becomes
      // visible again.
      if (document.visibilityState === "visible") {
        fetchTasks();
      }
    }, 60000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  }, []);

  const batchUpdate = useCallback(async (ids: string[], updates: Partial<Task>) => {
    const idSet = new Set(ids);
    if (idSet.size === 0) return;
    // Optimistic local apply — the UI snaps to the new state immediately.
    setTasks((prev) =>
      prev.map((t) => (idSet.has(t.id) ? { ...t, ...updates } : t)),
    );
    try {
      await batchUpdateTasks({ ids: Array.from(idSet), updates: updates as Record<string, unknown> });
    } catch {
      // On failure, the next periodic fetch will reconcile.
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        refreshTasks: () => fetchTasks(true),
        updateTask,
        batchUpdateTasks: batchUpdate,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
