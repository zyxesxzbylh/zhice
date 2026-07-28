"use client";

import { useEffect, useRef } from "react";
import { useSyncStore } from "@/lib/store";

export default function SyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const store = useSyncStore.getState;
    store().setOnline(navigator.onLine);

    const interval = setInterval(() => {
      store().setLastSyncAt(new Date().toISOString());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
