export default function Loading() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-brand-surface" />
        <div className="h-4 w-full rounded bg-brand-surface" />
        <div className="h-4 w-5/6 rounded bg-brand-surface" />
        <div className="h-4 w-2/3 rounded bg-brand-surface" />
      </div>
    </div>
  );
}
