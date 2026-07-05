'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupProfile } from '../../lib/api';
import type { GoalType } from '../../lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [goal, setGoal] = useState<GoalType>('maintenance');
  const [skeletalMuscle, setSkeletalMuscle] = useState<number | ''>('');
  const [bodyFatMass, setBodyFatMass] = useState<number | ''>('');
  const [bodyFatPct, setBodyFatPct] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus('맞춤 영양 목표를 계산 중입니다...');

    try {
      await setupProfile({
        nickname: nickname || undefined,
        gender,
        age,
        height_cm: height,
        weight_kg: weight,
        goal,
        skeletal_muscle_mass: skeletalMuscle === '' ? undefined : skeletalMuscle,
        body_fat_mass: bodyFatMass === '' ? undefined : bodyFatMass,
        body_fat_percentage: bodyFatPct === '' ? undefined : bodyFatPct,
      });
      router.push('/dashboard');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '설정에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 pb-8 text-slate-100">
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">시작하기</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">신체 정보 입력</h1>
          <p className="mt-3 text-slate-400">
            회원가입 없이 바로 시작합니다. 입력한 정보를 바탕으로 하루 권장 칼로리와 영양소 목표가 자동 계산됩니다.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-400">닉네임 (선택)</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 건강이"
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">성별</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">나이</span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">키 (cm)</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-400">몸무게 (kg)</span>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-400">운동 목표</span>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as GoalType)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="weight_loss">체중 감량</option>
                <option value="maintenance">체중 유지</option>
                <option value="weight_gain">근육/체중 증가</option>
              </select>
            </label>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-300">인바디 수치 (선택)</p>
            <p className="mt-1 text-xs text-slate-500">입력 시 더 정밀한 영양 목표가 계산됩니다.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-slate-400">골격근량 (kg)</span>
                <input
                  type="number"
                  value={skeletalMuscle}
                  onChange={(e) => setSkeletalMuscle(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 30"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">체지방량 (kg)</span>
                <input
                  type="number"
                  value={bodyFatMass}
                  onChange={(e) => setBodyFatMass(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 15"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">체지방률 (%)</span>
                <input
                  type="number"
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="예: 22"
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading ? '계산 중...' : '맞춤 식단 시작하기'}
          </button>
          {status && <p className="mt-4 text-center text-sm text-slate-300">{status}</p>}
        </div>
      </section>
    </main>
  );
}
