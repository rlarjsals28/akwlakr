'use client';

import { useState } from 'react';
import { uploadMeal } from '../lib/api';
import type { MealRecord } from '../lib/types';

interface MealUploadFormProps {
  onUploaded?: (meal: MealRecord) => void;
}

export default function MealUploadForm({ onUploaded }: MealUploadFormProps) {
  const [mealTime, setMealTime] = useState('아침');
  const [mealDate, setMealDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealRecord | null>(null);

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setStatus('이미지 파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('meal_time', mealTime);
    formData.append('meal_date', mealDate);
    formData.append('image', imageFile);

    setStatus('AI가 음식을 분석 중입니다...');
    setLoading(true);
    setResult(null);

    try {
      const data = await uploadMeal(formData);
      setResult(data);
      setStatus('분석이 완료되었습니다.');
      onUploaded?.(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">식사 기록</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">음식 사진 업로드</h2>
        <p className="mt-2 text-sm text-slate-400">사진을 찍어 업로드하면 AI가 음식과 영양소를 자동 분석합니다.</p>
      </div>

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-sm text-slate-400">식사 유형</span>
            <select
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            >
              <option>아침</option>
              <option>점심</option>
              <option>저녁</option>
              <option>간식</option>
            </select>
          </label>

          <label className="block rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-sm text-slate-400">날짜</span>
            <input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 p-6 text-center transition hover:border-emerald-500/50">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <img src={preview} alt="미리보기" className="mx-auto max-h-48 rounded-xl object-cover" />
          ) : (
            <>
              <p className="text-4xl">📷</p>
              <p className="mt-3 text-sm text-slate-300">탭하여 사진 선택 또는 촬영</p>
            </>
          )}
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? '분석 중...' : '음식 분석 시작'}
        </button>

        {status && <p className="text-center text-sm text-slate-300">{status}</p>}

        {result && (
          <div className="rounded-2xl bg-emerald-500/10 p-5">
            <p className="font-semibold text-emerald-300">분석 결과: {result.predicted_food}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300 sm:grid-cols-4">
              <span>{result.calories} kcal</span>
              <span>탄 {result.carbs}g</span>
              <span>단 {result.protein}g</span>
              <span>지 {result.fat}g</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
