import type { NutritionProgress } from '../lib/types';
import ProgressChart from './ProgressChart';
import MacroRingChart from './MacroRingChart';

interface NutritionCardProps {
  progress: NutritionProgress[];
  dailyCalories?: number;
}

export default function NutritionCard({ progress, dailyCalories }: NutritionCardProps) {
  const calorieItem = progress.find((item) => item.label === '칼로리');

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">영양 목표</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">오늘의 섭취 진행률</h2>
        </div>
        {dailyCalories && (
          <div className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-center">
            <p className="text-xs text-emerald-300">권장 칼로리</p>
            <p className="text-lg font-semibold text-emerald-400">{dailyCalories} kcal</p>
          </div>
        )}
      </div>

      {calorieItem && (
        <div className="mt-6 rounded-2xl bg-slate-950 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-400">오늘 섭취 칼로리</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {calorieItem.current}
                <span className="ml-1 text-base font-normal text-slate-400">kcal</span>
              </p>
            </div>
            <p className="text-sm text-slate-400">
              목표 {calorieItem.target} kcal ({calorieItem.percentage}%)
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <MacroRingChart progress={progress} />
      </div>

      <div className="mt-8">
        <ProgressChart progress={progress} />
      </div>
    </div>
  );
}
