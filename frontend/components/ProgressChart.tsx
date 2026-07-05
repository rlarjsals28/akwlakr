import type { NutritionProgress } from '../lib/types';

const COLORS = ['#34d399', '#38bdf8', '#a78bfa', '#fbbf24'];

function getBarColor(percentage: number, index: number): string {
  if (percentage > 110) return '#f87171';
  return COLORS[index % COLORS.length];
}

export default function ProgressChart({ progress }: { progress: NutritionProgress[] }) {
  return (
    <div className="space-y-5">
      {progress.map((item, index) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">{item.label}</span>
            <span className="font-medium text-white">
              {item.current}
              {item.unit} / {item.target}
              {item.unit}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor: getBarColor(item.percentage, index),
              }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">목표 대비 {item.percentage}%</p>
        </div>
      ))}
    </div>
  );
}
