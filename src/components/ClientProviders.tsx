"use client";

import dynamic from "next/dynamic";
import { ReactNode, useState, useEffect, useCallback } from "react";
import { TaskProvider } from "./TaskContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Global UX surface — keyboard-driven modals. Both listen for the
// events dispatched by `@/lib/keyboard` so the shortcuts work even
// when no other UI is mounted.
const CommandPalette = dynamic(
  () => import("./CommandPalette"),
  { ssr: false },
);
const KeyboardShortcutsHelp = dynamic(
  () => import("./KeyboardShortcutsHelp"),
  { ssr: false },
);

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ThemeProvider>
      <TaskProvider>
        {children}
        <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
        <KeyboardShortcutsHelp open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      </TaskProvider>
    </ThemeProvider>
  );
}
