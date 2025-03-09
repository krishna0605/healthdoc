'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FadeIn } from '@/components/animations/FadeIn';
import { FileUp, Calendar, Sparkles } from 'lucide-react';

interface UsageData {
  limit: number;
  used: number;
  remaining: number;
  resetDate: string;
  daysUntilReset: number;
}

export default function BillingPage() {
  const { user, accessToken } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/usage`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [accessToken]);

  const usagePercent = usage ? (usage.used / usage.limit) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Your Plan</h1>
        <p className="text-text-muted dark:text-gray-400">HealthDoc is free with usage limits.</p>
      </header>

      <div className="grid gap-8">
        {/* Free Plan Card */}
        <FadeIn delay={0.1}>
          <Card className="border-2 border-primary shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Current Plan</div>
                  <CardTitle className="text-3xl font-black">Free Forever</CardTitle>
                </div>
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <CardDescription className="mt-2">
                Enjoy AI-powered health report analysis with a monthly upload limit.
              </CardDescription>
            </CardHeader>
          </Card>
        </FadeIn>

        {/* Usage Card */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileUp className="w-6 h-6 text-primary" />
                <CardTitle>Monthly Uploads</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="h-20 flex items-center justify-center text-text-muted">
                  Loading usage...
                </div>
              ) : usage ? (
                <>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-2xl font-bold">{usage.used} / {usage.limit}</span>
                      <span className="text-text-muted">{usage.remaining} remaining</span>
                    </div>
                    <Progress value={usagePercent} className="h-3" />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Resets in <strong className="text-foreground">{usage.daysUntilReset} days</strong>
                      {' '}({new Date(usage.resetDate).toLocaleDateString()})
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-text-muted">
                  <p>5 uploads per month</p>
                  <p className="text-sm mt-1">Upload your first report to start tracking!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Features Card */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  '5 report uploads per month',
                  'AI-powered health analysis',
                  'Trend tracking & visualization',
                  'Family member profiles',
                  'Secure encrypted storage',
                  'Shareable report links'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
