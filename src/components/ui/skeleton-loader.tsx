// components/ui/skeleton-loader.tsx
interface SkeletonLoaderProps {
    type?: 'dashboard' | 'table' | 'card' | 'form';
    rows?: number;
  }
  
  export default function SkeletonLoader({ type = 'dashboard', rows = 3 }: SkeletonLoaderProps) {
    if (type === 'dashboard') {
      return (
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
  
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="ml-5 flex-1 space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
  
          {/* Table/List Skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  
    if (type === 'table') {
      return (
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-8 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    if (type === 'card') {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      );
    }
  
    if (type === 'form') {
      return (
        <div className="space-y-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      );
    }
  
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }