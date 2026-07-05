'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkProfileStatus } from '../../lib/api';
import WorkoutChat from '../../components/WorkoutChat';

export default function WorkoutPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('프로필을 확인하는 중...');

  useEffect(() => {
    async function verifyProfile() {
      try {
        const hasProfile = await checkProfileStatus();
        if (!hasProfile) {
          router.replace('/onboarding');
          return;
        }
        setReady(true);
        setStatus('');
      } catch {
        setStatus('프로필 확인에 실패했습니다.');
      }
    }

    verifyProfile();
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <p>{status}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-slate-100 md:pb-10">
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">운동 코치</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-4xl">
            AI와 함께 맞춤 운동 루틴 만들기
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            신체 정보와 목표를 바탕으로 대화하며 나만의 운동 계획을 설계해 보세요.
          </p>
        </div>

        <WorkoutChat />
      </section>
    </main>
  );
}
