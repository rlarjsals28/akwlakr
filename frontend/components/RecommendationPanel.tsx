import type { Recommendation } from '../lib/types';

export default function RecommendationPanel({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">AI 추천</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">맞춤 식단 제안</h2>
        <p className="mt-3 text-sm text-emerald-300">{recommendation.message}</p>
      </div>

      <div className="mt-6 space-y-3">
        {recommendation.suggestions.map((suggestion) => (
          <div key={suggestion} className="rounded-2xl bg-slate-950 p-4">
            <p className="text-sm leading-relaxed text-slate-300">{suggestion}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-400">다음 식사 추천</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {recommendation.next_meal_ideas.map((idea) => (
            <span
              key={idea}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300"
            >
              {idea}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
