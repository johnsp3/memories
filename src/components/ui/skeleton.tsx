import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

// Specific skeleton components for common use cases
export function PostCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
      {/* Media skeleton */}
      <Skeleton className="h-64 w-full" />
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        
        {/* Excerpt */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        
        {/* Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PostFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title field */}
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      
      {/* Content field */}
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-32 w-full" />
      </div>
      
      {/* Excerpt field */}
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      {/* Tags field */}
      <div>
        <Skeleton className="h-4 w-12 mb-2" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
      
      {/* Media upload */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-32 w-full" />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 justify-end">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* User info */}
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      
      {/* Comment content */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      
      {/* Rating */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-4" />
        ))}
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )}
    />
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 text-center">{message}</p>
    </div>
  );
} 