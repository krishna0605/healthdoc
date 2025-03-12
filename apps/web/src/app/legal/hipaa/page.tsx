'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Server, Users, FileCheck } from 'lucide-react';

export default function HIPAAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-background-dark dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Shield className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">HIPAA Policy</h1>
              <p className="text-gray-500">Last updated: January 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <FileCheck className="size-6 text-primary" />
              HIPAA Compliance Statement
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              HealthDoc is committed to protecting the privacy and security of your Protected Health Information (PHI) 
              in compliance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA). This policy 
              outlines our practices and your rights regarding your health information.
            </p>
          </section>

          {/* Data Protection */}
          <section className="mb-12 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
              <Lock className="size-6 text-primary" />
              Data Protection Measures
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <div className="size-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span><strong>End-to-End Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="size-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span><strong>Secure Infrastructure:</strong> Our systems are hosted on HIPAA-compliant cloud infrastructure with regular security audits.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="size-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span><strong>Access Controls:</strong> Strict role-based access controls ensure only authorized personnel can access PHI.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="size-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <span><strong>Audit Logging:</strong> All access to PHI is logged and monitored for suspicious activity.</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
              <Users className="size-6 text-primary" />
              Your Rights Under HIPAA
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Right to Access</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You have the right to access, view, and obtain copies of your health records stored in our system.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Right to Amend</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You may request amendments to your health information if you believe it is inaccurate or incomplete.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Right to Restrict</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You can request restrictions on how we use or disclose your health information.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Right to Accounting</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You may request a list of disclosures we have made of your health information.
                </p>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section className="mb-12 bg-primary/5 dark:bg-primary/10 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <Server className="size-6 text-primary" />
              Data Storage & Processing
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your medical reports and health data are:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Stored securely on Supabase infrastructure with encryption</li>
              <li>• Processed by AI systems solely for analysis and insights</li>
              <li>• Never sold, shared, or used for advertising purposes</li>
              <li>• Retained only as long as you maintain an active account</li>
              <li>• Completely deleted upon account closure request</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have questions about our HIPAA compliance or wish to exercise your rights, please contact us:
            </p>
            <a 
              href="mailto:creativesimulation1@gmail.com" 
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              creativesimulation1@gmail.com
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}
