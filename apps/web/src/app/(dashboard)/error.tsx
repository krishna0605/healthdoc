'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="size-16 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center mb-6 text-red-500">
        <span className="material-symbols-outlined text-4xl">warning</span>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong!
      </h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        We encountered an unexpected error while loading this page. Our team has been notified.
      </p>

      <div className="flex gap-4">
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Try again
        </button>
        
        <button
           onClick={() => window.location.reload()}
           className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            Reload Page
        </button>
      </div>
    </div>
  );
}
