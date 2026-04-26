export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar skeleton */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
        <div className="h-9 w-64 rounded-md bg-muted animate-pulse" />
        <div className="ml-auto h-8 w-24 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-lg bg-muted/50 animate-pulse"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
