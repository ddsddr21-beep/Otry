import React from 'react';
import { XpToast } from '../types';
import { Zap } from 'lucide-react';

interface Props {
  toasts: XpToast[];
}

export default function XpToastContainer({ toasts }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-50 flex flex-col gap-2 pointer-events-none items-center md:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#0f172a]/95 backdrop-blur-2xl border border-amber-500/40 text-white px-5 py-3.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ring-1 ring-white/10"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="flex flex-col text-right" dir="rtl">
            <span className="font-cinematic font-bold text-amber-300 text-xs tracking-wider">
              +{toast.amount} XP
            </span>
            <span className="text-xs text-slate-200 font-reading-ar">
              {toast.reason}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

