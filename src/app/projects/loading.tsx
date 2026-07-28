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
            {/* Summary stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                />
              ))}
            </div>

            {/* Search + action bar */}
            <div className="flex items-center justify-between">
              <div
                className="h-9 w-72 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
              <div
                className="h-9 w-28 rounded-lg animate-pulse"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              />
            </div>

            {/* Project cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 space-y-3 animate-pulse"
                  style={{
                    backgroundColor: 'var(--bg-muted)',
                    opacity: 0.9 - i * 0.1,
                  }}
                >
                  <div
                    className="h-5 w-3/4 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  />
                  <div
                    className="h-3 w-full rounded"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  />
                  <div
                    className="h-3 w-5/6 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <div
                      className="h-6 w-16 rounded-full"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    />
                    <div
                      className="h-2 flex-1 rounded"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Project list rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl animate-pulse"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  opacity: 0.9 - i * 0.1,
                }}
              >
                <div
                  className="h-10 w-10 rounded-lg shrink-0"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)', width: `${50 - i * 10}%` }}
                  />
                  <div
                    className="h-3 rounded"
                    style={{ backgroundColor: 'var(--bg-surface)', width: '35%' }}
                  />
                </div>
                <div
                  className="h-6 w-20 rounded-full hidden sm:block"
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
