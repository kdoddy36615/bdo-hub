export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="mt-2 h-4 w-72 rounded bg-muted" />
      </div>
      <div className="h-40 rounded-lg bg-muted" />
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  );
}
