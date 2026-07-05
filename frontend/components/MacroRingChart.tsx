'use client';

import type { NutritionProgress } from '../lib/types';

const RING_COLORS = ['#34d399', '#38bdf8', '#a78bfa'];

export default function MacroRingChart({ progress }: { progress: NutritionProgress[] }) {
  const macros = progress.filter((item) => item.label !== '칼로리').slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-4">
      {macros.map((item, index) => {
        const pct = Math.min(item.percentage, 100);
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (pct / 100) * circumference;

        return (
          <div key={item.label} className="flex flex-col items-center rounded-2xl bg-slate-950 p-4">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke={RING_COLORS[index]}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-2 text-xs text-slate-400">{item.label}</p>
            <p className="text-lg font-semibold text-white">{pct}%</p>
          </div>
        );
      })}
    </div>
  );
}
