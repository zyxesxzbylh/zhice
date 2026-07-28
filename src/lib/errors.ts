import toast from "react-hot-toast";

export class ApiError extends Error {
  public status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function handleApiError(error: unknown): void {
  if (error instanceof DOMException && error.name === "AbortError") {
    return;
  }
  
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }
  
  if (error instanceof Error) {
    toast.error(error.message || "操作失败");
    return;
  }
  
  toast.error("未知错误，请重试");
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error);
    return undefined;
  }
}