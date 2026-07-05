'use client';

import { useEffect, useRef, useState } from 'react';
import { clearWorkoutHistory, fetchWorkoutHistory, sendWorkoutMessage } from '../lib/api';
import type { ChatMessage } from '../lib/types';

const QUICK_PROMPTS = [
  '초보자 주 3일 헬스장 다이어트 루틴 짜줘',
  '홈트로 상체 운동 4일 루틴',
  '하체 집중 근력 루틴 추천해줘',
  '운동 전 워밍업 방법 알려줘',
];

function formatMessage(content: string) {
  return content.split('\n').map((line, index) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={index} className="block">
        {parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIndex} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIndex}>{part}</span>;
        })}
      </span>
    );
  });
}

export default function WorkoutChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [provider, setProvider] = useState('local');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await fetchWorkoutHistory();
        setMessages(data.history);
        setProvider(data.provider);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : '대화 기록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setSending(true);
    setError('');
    setInput('');

    const optimisticUser: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const data = await sendWorkoutMessage(content);
      setMessages(data.history);
      setProvider(data.provider);
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticUser.id));
      setInput(content);
      setError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  async function handleReset() {
    if (!confirm('대화를 초기화할까요?')) return;

    setSending(true);
    setError('');
    try {
      const data = await clearWorkoutHistory();
      setMessages(data.history);
      setProvider(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : '대화 초기화에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-950/30 md:h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">AI 운동 코치</p>
          <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">맞춤 운동 루틴 상담</h2>
          <p className="mt-1 text-xs text-slate-500">
            {provider === 'openai' ? 'GPT 기반 응답' : '프로필 기반 맞춤 응답'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={sending || loading}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-200 disabled:opacity-50"
        >
          대화 초기화
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        {loading && (
          <p className="text-center text-sm text-slate-500">대화를 불러오는 중...</p>
        )}

        {!loading &&
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                    isUser
                      ? 'bg-emerald-400 text-slate-950'
                      : 'border border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  {!isUser && (
                    <p className="mb-2 text-xs font-medium text-emerald-400">AI 코치</p>
                  )}
                  <div className="whitespace-pre-wrap">{formatMessage(message.content)}</div>
                </div>
              </div>
            );
          })}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
              루틴을 구성하는 중...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!loading && messages.length <= 1 && (
        <div className="border-t border-slate-800 px-4 py-3 sm:px-6">
          <p className="mb-2 text-xs text-slate-500">빠른 질문</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={sending}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="px-4 pb-2 text-center text-sm text-red-400 sm:px-6">{error}</p>
      )}

      <form
        className="border-t border-slate-800 p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="운동 목표, 경험, 가능한 일수를 알려주세요..."
            disabled={loading || sending}
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || sending || !input.trim()}
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
