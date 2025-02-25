import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 p-8 bg-blue-50 dark:bg-blue-900/10 rounded-full animate-pulse">
          <span className="material-symbols-outlined text-6xl text-blue-500">
            search
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
            Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link 
            href="/" 
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
            <span className="material-symbols-outlined text-xl">home</span>
            Back to Home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
