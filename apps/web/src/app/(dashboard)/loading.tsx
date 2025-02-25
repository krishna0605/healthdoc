export default function Loading() {
    return (
      <div className="max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-8 pt-4">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-3"></div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>
  
        {/* Quick Actions Skeleton */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
             ))}
        </div>
  
        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-[2.5rem]"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-[2rem]"></div>
          </div>
          <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-[2rem]"></div>
               ))}
          </div>
        </div>
      </div>
    );
  }
