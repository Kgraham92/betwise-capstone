import { GameCardSkeleton } from "@/components/ui/Skeleton";

export default function GamesLoading() {
  return (
    <div className="min-h-screen bg-brand-midnight">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="h-9 w-48 bg-brand-muted/20 rounded animate-pulse mb-2" />
          <div className="h-5 w-72 bg-brand-muted/20 rounded animate-pulse" />
        </div>

        {/* Sport Selector Skeleton */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-16 bg-brand-muted/20 rounded-full animate-pulse"
            />
          ))}
        </div>

        {/* Games Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
