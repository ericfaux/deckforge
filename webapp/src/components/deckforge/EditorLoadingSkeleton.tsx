import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton shown while editor initializes
 * Mimics the actual editor layout for smooth perceived performance
 */
export function EditorLoadingSkeleton() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border flex items-center px-4 bg-card h-12">
        <Skeleton className="h-6 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Quick Access Toolbar skeleton */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-card border-b border-border">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <div className="w-px h-6 bg-border mx-2" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool rail skeleton */}
        <div className="w-16 border-r border-border bg-card flex flex-col items-center gap-2 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded" />
          ))}
        </div>

        {/* Tool drawer skeleton */}
        <div className="w-64 border-r border-border bg-card p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded" />
            ))}
          </div>
        </div>

        {/* Canvas area skeleton */}
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <Skeleton className="h-[600px] w-[240px] rounded-lg" />
        </div>

        {/* Inspector skeleton */}
        <div className="w-80 border-l border-border bg-card p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Layers panel skeleton */}
        <div className="w-64 border-l border-border bg-card p-4">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    </div>
  );
}
