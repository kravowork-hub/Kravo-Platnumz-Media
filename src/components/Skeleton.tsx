export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      {...props}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col border border-[var(--border-color)] bg-[var(--bg-card)] rounded-sm overflow-hidden h-full">
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ArticlePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10 text-center max-w-3xl mx-auto">
        <div className="flex justify-center gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 md:h-14 w-full mb-4 mx-auto" />
        <Skeleton className="h-10 md:h-14 w-3/4 mx-auto mb-6" />
        <Skeleton className="h-6 w-full mx-auto mb-2" />
        <Skeleton className="h-6 w-5/6 mx-auto mb-8" />
        <div className="flex items-center justify-center gap-4 py-4 border-t border-b border-[var(--border-color)]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>
      <Skeleton className="w-full aspect-[21/9] mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        <div className="md:col-span-2 hidden md:block">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className="md:col-span-10 lg:col-span-9 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}
