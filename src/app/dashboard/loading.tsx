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
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                />
              ))}
            </div>

            {/* Chart row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                />
              ))}
            </div>

            {/* Content rows — staggered opacity for visual depth */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  opacity: 0.9 - i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
