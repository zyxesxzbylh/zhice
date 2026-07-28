"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-[var(--bg-muted-hover)] rounded
        ${className}
      `}
    />
  );
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="ml-4 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatsCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTaskCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 ${className}`}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-1.5 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    </div>
  );
}

export function SkeletonProjectCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[cols] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProjectCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard({ className = "" }: SkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 搜索栏 */}
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>
      
      {/* 标签 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
      
      {/* 列表 */}
      <SkeletonList count={4} />
    </div>
  );
}
