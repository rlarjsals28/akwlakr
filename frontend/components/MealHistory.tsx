import type { MealRecord } from '../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MealHistory({ meals }: { meals: MealRecord[] }) {
  if (meals.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">아직 기록된 식사가 없습니다.</p>
        <p className="mt-2 text-sm text-slate-500">음식 사진을 업로드해 분석을 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <div
          key={meal.id}
          className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
        >
          {meal.image_url ? (
            <img
              src={`${API_BASE}/uploads/${meal.image_url}`}
              alt={meal.predicted_food || '음식'}
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 text-2xl">
              🍽️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                {meal.meal_time}
              </span>
              {meal.confidence && (
                <span className="text-xs text-slate-500">신뢰도 {(meal.confidence * 100).toFixed(0)}%</span>
              )}
            </div>
            <p className="mt-1 truncate font-medium text-white">{meal.predicted_food || '분석된 음식'}</p>
            <p className="text-sm text-slate-400">
              {meal.calories} kcal · 탄 {meal.carbs}g · 단 {meal.protein}g · 지 {meal.fat}g
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
