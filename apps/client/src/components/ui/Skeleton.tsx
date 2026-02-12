type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-brand-muted/20 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

export function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="text-center mb-6">
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-40 mx-auto" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
      <div className="bg-brand-surface border border-brand-muted/10 rounded-xl p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}
