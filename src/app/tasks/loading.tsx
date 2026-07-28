export default function Loading() {
  return (
    <div className="flex h-dvh">
      {/* Sidebar skeleton — full height fixed width */}
      <div
        className="hidden md:flex w-64 shrink-0 flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        <div className="p-6 space-y-6">
          {/* Brand */}
          <div
            className="h-8 w-24 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
          {/* Nav items */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <header
          className="h-14 shrink-0 flex items-center px-4 md:px-6"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div
            className="h-5 w-32 rounded animate-pulse"
            style={{ backgroundColor: 'var(--bg-muted)' }}
          />
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Filter bar */}
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-80 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
              <div
                className="h-9 w-24 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
              <div
                className="h-9 w-24 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
            </div>

            {/* Task list items — staggered opacity for visual depth */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl animate-pulse"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  opacity: 0.9 - i * 0.08,
                }}
              >
                {/* Checkbox placeholder */}
                <div
                  className="h-5 w-5 rounded shrink-0"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                />
                {/* Title line */}
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)', width: `${60 + (i * 5)}%` }}
                  />
                  <div
                    className="h-3 rounded hidden md:block"
                    style={{ backgroundColor: 'var(--bg-surface)', width: '40%' }}
                  />
                </div>
                {/* Priority badge */}
                <div
                  className="h-6 w-16 rounded-full hidden sm:block"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
