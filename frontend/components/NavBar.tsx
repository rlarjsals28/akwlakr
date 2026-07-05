'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { resetSession } from '../lib/session';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleReset = () => {
    if (typeof window !== 'undefined' && confirm('프로필을 초기화하고 처음부터 시작하시겠습니까?')) {
      resetSession();
      router.push('/onboarding');
    }
  };

  if (pathname === '/onboarding') {
    return (
      <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
          <span className="text-lg font-semibold text-white">AI Nutrition Coach</span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-semibold text-white sm:text-xl">
          AI Nutrition Coach
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-300">
          <Link href="/dashboard" className="hidden hover:text-white sm:inline">
            대시보드
          </Link>
          <Link href="/workout" className="hidden hover:text-white sm:inline">
            운동 코치
          </Link>
          <Link href="/onboarding" className="hidden hover:text-white sm:inline">
            프로필 수정
          </Link>
          <button
            onClick={handleReset}
            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
          >
            초기화
          </button>
        </nav>
      </div>
    </header>
  );
}
