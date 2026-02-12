"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-brand-muted/10 bg-brand-surface p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-brand-white">
          Something went wrong
        </h1>
        <p className="text-sm text-brand-muted">
          We hit an unexpected error while loading this page.
        </p>
        {error?.message ? (
          <p className="text-xs text-brand-muted/80 break-words">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-midnight"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
