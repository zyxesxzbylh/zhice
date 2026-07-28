import { useSyncStore } from "./store";

interface SyncOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function createSync() {
  const store = useSyncStore.getState;

  async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("未登录");
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `请求失败 (${res.status})`);
    }

    return res.json();
  }

  async function loadProjects() {
    store().setSyncing(true);
    try {
      const projects = await fetchJson("/api/projects");
      store().setLastSyncAt(new Date().toISOString());
      return projects;
    } finally {
      store().setSyncing(false);
    }
  }

  async function loadProjectDetail(projectId: string) {
    store().setSyncing(true);
    try {
      const project = await fetchJson(`/api/projects/${projectId}`);
      store().setLastSyncAt(new Date().toISOString());
      return project;
    } finally {
      store().setSyncing(false);
    }
  }

  async function createProject(data: {
    name: string;
    description?: string;
    flowTemplateId?: string;
  }) {
    store().setSyncing(true);
    try {
      const project = await fetchJson("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      store().setLastSyncAt(new Date().toISOString());
      return project;
    } finally {
      store().setSyncing(false);
    }
  }

  async function createTask(data: {
    projectId: string;
    parentTaskId?: string | null;
    title: string;
    description?: string;
  }) {
    store().setSyncing(true);
    try {
      const task = await fetchJson("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      store().setLastSyncAt(new Date().toISOString());
      return task;
    } finally {
      store().setSyncing(false);
    }
  }

  async function updateTask(
    taskId: string,
    data: Record<string, unknown>
  ) {
    store().setSyncing(true);
    try {
      const task = await fetchJson(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      store().setLastSyncAt(new Date().toISOString());
      return task;
    } finally {
      store().setSyncing(false);
    }
  }

  async function deleteTask(taskId: string) {
    store().setSyncing(true);
    try {
      await fetchJson(`/api/tasks/${taskId}`, { method: "DELETE" });
      store().setLastSyncAt(new Date().toISOString());
    } finally {
      store().setSyncing(false);
    }
  }

  async function smartSplit(taskId: string, title: string, description?: string | null) {
    store().setSyncing(true);
    try {
      const result = await fetchJson<{ subtasks: { title: string; description: string }[] }>(
        "/api/tasks/smart-split",
        { method: "POST", body: JSON.stringify({ title, description }) }
      );
      store().setLastSyncAt(new Date().toISOString());
      return result.subtasks;
    } finally {
      store().setSyncing(false);
    }
  }

  return {
    loadProjects,
    loadProjectDetail,
    createProject,
    createTask,
    updateTask,
    deleteTask,
    smartSplit,
  };
}

export const sync = createSync();
