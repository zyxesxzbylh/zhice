"use client";

import { useRouter } from "next/navigation";

interface EmptyStateProps {
  icon: "tasks" | "projects" | "templates" | "search";
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  searchMode?: boolean;
}

const iconPaths: Record<string, string> = {
  tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  projects: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  templates: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
};

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  actionUrl,
  searchMode 
}: EmptyStateProps) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPaths[icon]} />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>
      {actionText && actionUrl && !searchMode && (
        <button
          onClick={() => { if (actionUrl) router.push(actionUrl); }}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {actionText}
        </button>
      )}
    </div>
  );
}