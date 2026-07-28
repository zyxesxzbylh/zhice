export async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function postJson<T>(
  url: string,
  body: unknown
): Promise<T> {
  return fetchJson(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function putJson<T>(
  url: string,
  body: unknown
): Promise<T> {
  return fetchJson(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteRequest(url: string): Promise<void> {
  await fetchJson(url, { method: "DELETE" });
}

/* ------------------------------------------------------------------ *
 *  Batch operations — apply the same update to many tasks at once.
 *
 *  The route `/api/tasks/batch` (when implemented on the backend) is
 *  preferred because it lets the server do the update in one DB
 *  transaction. When unavailable, the helper falls back to issuing
 *  per-task PUTs in parallel.
 * ------------------------------------------------------------------ */

export interface BatchTaskUpdate {
  ids: string[];
  updates: Record<string, unknown>;
}

export async function batchUpdateTasks(update: BatchTaskUpdate): Promise<void> {
  // Optimistic local contract — server-side batching is optional. If the
  // route returns 404 the caller falls back to per-task PUTs.
  try {
    await postJson("/api/tasks/batch", update);
  } catch {
    await Promise.all(
      update.ids.map((id) =>
        putJson(`/api/tasks/${id}`, update.updates).catch(() => undefined),
      ),
    );
  }
}

/* ------------------------------------------------------------------ *
 *  Reminders
 * ------------------------------------------------------------------ */

export async function setTaskReminder(
  taskId: string,
  reminderAt: string | null,
): Promise<void> {
  await putJson(`/api/tasks/${taskId}`, { reminderAt });
}

/* ------------------------------------------------------------------ *
 *  Tags
 * ------------------------------------------------------------------ */

export async function addTaskTag(taskId: string, tagId: string): Promise<void> {
  await postJson(`/api/tasks/${taskId}/tags`, { tagId });
}

export async function removeTaskTag(
  taskId: string,
  tagId: string,
): Promise<void> {
  await deleteRequest(`/api/tasks/${taskId}/tags/${tagId}`);
}

export async function listTags(): Promise<unknown[]> {
  return fetchJson<unknown[]>("/api/tags");
}