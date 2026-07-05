'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchDashboard } from '../../lib/api';
import type { DashboardData } from '../../lib/types';
import NutritionCard from '../../components/NutritionCard';
import MealUploadForm from '../../components/MealUploadForm';
import RecommendationPanel from '../../components/RecommendationPanel';
import MealHistory from '../../components/MealHistory';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState('데이터를 불러오는 중...');
  const [mealDate] = useState(new Date().toISOString().slice(0, 10));

  const loadDashboard = useCallback(async () => {
    try {
      const dashboard = await fetchDashboard(mealDate);
      setData(dashboard);
      setStatus('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '데이터 로드 실패';
      if (message.includes('프로필')) {
        router.replace('/onboarding');
        return;
      }
      setStatus(message);
    }
  }, [mealDate, router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const greeting = data?.user.nickname || '사용자';

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-slate-100 md:pb-10">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">대시보드</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-4xl">
            안녕하세요, {greeting}님
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            오늘의 영양 섭취 현황과 AI 식단 추천을 확인하세요.
          </p>

          {data?.user && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'BMR', value: `${data.user.bmr} kcal` },
                { label: '권장 칼로리', value: `${data.user.daily_calories} kcal` },
                { label: '단백질 목표', value: `${data.user.protein_g} g` },
                { label: '탄수화물 목표', value: `${data.user.carbs_g} g` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-950/80 p-3 sm:p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white sm:text-base">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {status && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center text-sm text-slate-300">
            {status}
          </div>
        )}

        {data && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: '오늘 칼로리', value: data.summary.total_calories, unit: 'kcal' },
                  { label: '탄수화물', value: data.summary.total_carbs, unit: 'g' },
                  { label: '단백질', value: data.summary.total_protein, unit: 'g' },
                  { label: '지방', value: data.summary.total_fat, unit: 'g' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                      {item.value}
                      <span className="ml-1 text-sm font-normal text-slate-400">{item.unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              <NutritionCard progress={data.progress} dailyCalories={data.user.daily_calories} />

              <div id="upload">
                <MealUploadForm onUploaded={() => loadDashboard()} />
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold text-white">오늘의 식사 기록</h2>
                <MealHistory meals={data.summary.meals} />
              </div>
            </div>

            <RecommendationPanel recommendation={data.recommendation} />
          </div>
        )}
      </section>
    </main>
  );
}
