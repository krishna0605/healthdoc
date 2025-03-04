'use client'

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { FadeIn } from '@/components/animations/FadeIn';

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Auto-trigger from URL param (e.g. from marketing page)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get('plan');
        if (planParam && (planParam === 'PRO' || planParam === 'FAMILY') && !loading) {
            // Remove param to prevent loop
            window.history.replaceState({}, '', '/settings/billing');
            handleUpgrade(planParam);
        }
    }
  }, [user]); // Wait for user to be loaded

  const handleUpgrade = async (planTier: 'PRO' | 'FAMILY') => {
    setLoading(planTier);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          planTier: planTier,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout failed:', data);
        alert(`Failed to initialize checkout: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Upgrade failed', error);
      alert(`Payment initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const currentPlan = user?.planTier || 'BASIC';

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Subscription Plans</h1>
        <p className="text-text-muted dark:text-gray-400">Choose the plan that fits your health journey.</p>
        
        {/* DEBUG INFO - TO BE REMOVED */}
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-500">
          DEBUG: API_URL = {process.env.NEXT_PUBLIC_API_URL || '(undefined)'}
        </div>
      </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* BASIC PLAN */}
         <FadeIn delay={0.1}>
           <Card className={`h-full border-2 ${currentPlan === 'BASIC' ? 'border-primary shadow-lg scale-105' : 'border-gray-100 dark:border-gray-800'}`}>
             <CardHeader>
               <div className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Basic</div>
               <CardTitle className="text-4xl font-black mb-2">$0<span className="text-base font-medium text-text-muted">/mo</span></CardTitle>
               <CardDescription>Essential for starting your health tracking.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <ul className="space-y-3 text-sm">
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 10 monthly document uploads</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Encrypted health record storage</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Standard PDF report exports</li>
                 <li className="flex items-center gap-2 text-text-muted/50"><X className="size-4" /> RAG AI Chat assistant</li>
               </ul>
             </CardContent>
             <CardFooter>
               <Button className="w-full" disabled={currentPlan === 'BASIC'} variant={currentPlan === 'BASIC' ? 'outline' : 'default'}>
                 {currentPlan === 'BASIC' ? 'Current Plan' : 'Get Started Free'}
               </Button>
             </CardFooter>
           </Card>
         </FadeIn>

         {/* PRO PLAN */}
         <FadeIn delay={0.2}>
           <Card className={`h-full border-2 relative overflow-hidden ${currentPlan === 'PRO' ? 'border-primary shadow-2xl scale-105 z-10' : 'border-blue-500/20 dark:border-blue-500/30'}`}>
             {currentPlan !== 'PRO' && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Most Popular</div>}
             <CardHeader>
               <div className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Pro</div>
               <CardTitle className="text-4xl font-black mb-2">$19<span className="text-base font-medium text-text-muted">/mo</span></CardTitle>
               <CardDescription>Advanced AI tools for peak performance.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <ul className="space-y-3 text-sm">
                 <li className="flex items-center gap-2"><Check className="size-4 text-blue-500" /> Unlimited report generation</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-blue-500" /> Advanced health trend analysis</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-blue-500" /> RAG AI Chat assistant (24/7)</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-blue-500" /> Priority AI processing speed</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-blue-500" /> Early access to new features</li>
               </ul>
             </CardContent>
             <CardFooter>
               <Button 
                 className={`w-full ${currentPlan === 'PRO' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                 disabled={currentPlan === 'PRO' || !!loading}
                 onClick={() => handleUpgrade('PRO')}
               >
                 {loading === 'PRO' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {currentPlan === 'PRO' ? 'Active Plan' : 'Get Pro Today'}
               </Button>
             </CardFooter>
           </Card>
         </FadeIn>

         {/* FAMILY PLAN */}
         <FadeIn delay={0.3}>
           <Card className={`h-full border-2 ${currentPlan === 'FAMILY' ? 'border-primary shadow-lg scale-105' : 'border-gray-100 dark:border-gray-800'}`}>
             <CardHeader>
               <div className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Family</div>
               <CardTitle className="text-4xl font-black mb-2">$49<span className="text-base font-medium text-text-muted">/mo</span></CardTitle>
               <CardDescription>Comprehensive care for your whole household.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <ul className="space-y-3 text-sm">
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Up to 5 individual profiles</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Centralized family dashboard</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Enhanced doctor-sharing portal</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> VIP support & AI processing</li>
                 <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Unified billing for all members</li>
               </ul>
             </CardContent>
             <CardFooter>
               <Button 
                  className="w-full" 
                  variant={currentPlan === 'FAMILY' ? 'outline' : 'secondary'}
                  disabled={currentPlan === 'FAMILY' || !!loading}
                  onClick={() => handleUpgrade('FAMILY')}
               >
                 {loading === 'FAMILY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {currentPlan === 'FAMILY' ? 'Active Plan' : 'Select Family Plan'}
               </Button>
             </CardFooter>
           </Card>
         </FadeIn>
       </div>
    </div>
  );
}
