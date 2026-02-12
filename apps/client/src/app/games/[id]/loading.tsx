import { GameDetailSkeleton } from "@/components/ui/Skeleton";

export default function GameDetailLoading() {
  return (
    <div className="min-h-screen bg-brand-midnight">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="h-5 w-32 bg-brand-muted/20 rounded animate-pulse mb-6" />
        <GameDetailSkeleton />
      </div>
    </div>
  );
}
