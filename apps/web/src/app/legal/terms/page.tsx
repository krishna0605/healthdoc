'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale, XCircle, Clock, Globe } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="size-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Terms of Service</h1>
              <p className="text-gray-500">Last updated: January 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">

          {/* Acceptance */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <CheckCircle className="size-6 text-primary" />
              Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              By accessing or using HealthDoc ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service. We reserve the right to modify 
              these terms at any time, and your continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-12 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Service Description</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              HealthDoc provides an AI-powered medical report analysis service that:
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
                <span>Analyzes uploaded medical reports and lab results</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
                <span>Provides simplified explanations of medical terminology</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
                <span>Tracks health metrics over time</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="size-5 text-green-500 shrink-0 mt-0.5" />
                <span>Enables secure sharing with healthcare providers</span>
              </li>
            </ul>
          </section>

          {/* Important Disclaimer */}
          <section className="mb-12 bg-amber-50 dark:bg-amber-900/20 p-8 rounded-2xl border border-amber-200 dark:border-amber-800">
            <h2 className="text-2xl font-bold mb-4 text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="size-6" />
              Important Medical Disclaimer
            </h2>
            <p className="text-amber-700 dark:text-amber-300 font-medium mb-4">
              HealthDoc is NOT a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <ul className="space-y-2 text-amber-600 dark:text-amber-300">
              <li>• Always consult with qualified healthcare providers for medical decisions</li>
              <li>• Our AI analysis is for informational purposes only</li>
              <li>• Do not delay seeking medical attention based on our Service</li>
              <li>• We do not provide emergency medical services</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
              <Scale className="size-6 text-primary" />
              User Responsibilities
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
                <h3 className="font-bold text-green-800 dark:text-green-400 mb-3">You Agree To:</h3>
                <ul className="space-y-2 text-green-700 dark:text-green-300 text-sm">
                  <li>✓ Provide accurate information</li>
                  <li>✓ Keep your account credentials secure</li>
                  <li>✓ Use the Service lawfully</li>
                  <li>✓ Respect others' privacy</li>
                  <li>✓ Report any security issues</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
                <h3 className="font-bold text-red-800 dark:text-red-400 mb-3">You Must Not:</h3>
                <ul className="space-y-2 text-red-700 dark:text-red-300 text-sm">
                  <li>✗ Share your account with others</li>
                  <li>✗ Upload false or misleading content</li>
                  <li>✗ Attempt to hack or exploit the Service</li>
                  <li>✗ Use automated systems without permission</li>
                  <li>✗ Violate any applicable laws</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-12 bg-gray-50 dark:bg-gray-800/50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <XCircle className="size-6 text-primary" />
              Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To the fullest extent permitted by law:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• HealthDoc is provided "as is" without warranties of any kind</li>
              <li>• We are not liable for any indirect, incidental, or consequential damages</li>
              <li>• Our total liability shall not exceed the amount you paid for the Service</li>
              <li>• We do not guarantee uninterrupted or error-free service</li>
            </ul>
          </section>

          {/* Termination */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <Clock className="size-6 text-primary" />
              Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Either party may terminate this agreement at any time:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• <strong>By You:</strong> Delete your account through the settings page</li>
              <li>• <strong>By Us:</strong> We may suspend or terminate accounts that violate these terms</li>
              <li>• <strong>Effect:</strong> Upon termination, your access will be revoked and data may be deleted</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-12 bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 dark:text-white flex items-center gap-2">
              <Globe className="size-6 text-primary" />
              Governing Law
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              in which HealthDoc operates, without regard to conflict of law principles. Any disputes arising 
              from these Terms or the Service shall be resolved through binding arbitration.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-primary/5 dark:bg-primary/10 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Questions?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about these Terms of Service, please contact us at:
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
