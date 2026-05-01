type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-md bg-elev-2/70 ${className}`}
      aria-hidden
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-elev/40 p-5 backdrop-blur-xl">
      <Skeleton className="h-2 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-2 h-2 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-elev/40 backdrop-blur-xl">
      <div className="flex h-11 items-center gap-3 border-b border-border px-5">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-2 w-20" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-3 ${j === 0 ? "w-32" : j === cols - 1 ? "w-12" : "flex-1"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-elev/40 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-5/6" />
            <Skeleton className="h-2 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
