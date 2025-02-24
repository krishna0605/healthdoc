import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const epilogue = Epilogue({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-epilogue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthDoc | Your Health, Translated",
  description: "AI-powered personal health record analysis. Upload medical reports and get instant, understandable insights.",
  keywords: ["medical", "health", "AI", "analysis", "reports", "healthcare", "HIPAA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={epilogue.variable} suppressHydrationWarning>
      <head>
        {/* Material Symbols Icons */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
        {/* Theme initialization script - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-main dark:text-gray-100 antialiased selection:bg-primary/20 transition-colors duration-300">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
