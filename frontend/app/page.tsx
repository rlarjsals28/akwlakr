'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkProfileStatus } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const hasProfile = await checkProfileStatus();
        router.replace(hasProfile ? '/dashboard' : '/onboarding');
      } catch {
        router.replace('/onboarding');
      }
    };
    redirect();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <p className="text-4xl">🥗</p>
        <p className="mt-4 text-slate-400">AI Nutrition Coach 로딩 중...</p>
      </div>
    </main>
  );
}
