import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, BookOpen, Layers, Check, ArrowRight, Wand2 } from 'lucide-react';
import { SentenceGrammarAnalysis } from '../types';

interface Props {
  analysis: SentenceGrammarAnalysis;
  onClose: () => void;
}

export default function SentenceGrammarModal({ analysis, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-[#0e1c38] border border-amber-500/35 rounded-t-[32px] sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[88vh] overflow-hidden text-slate-100 ring-1 ring-amber-400/20 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 bg-[#091326] border-b border-indigo-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-cinematic font-bold text-white uppercase tracking-wider">
                SENTENCE GRAMMAR & SYNTAX BREAKDOWN
              </h3>
              <p className="text-xs text-slate-400 font-reading-ar" dir="rtl">
                تحليل البنية النحوية، الأزمنة، والأجزاء التركيبية للجملة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Sentence Box */}
          <div className="p-4 bg-[#091326] rounded-2xl border border-indigo-500/25 space-y-2">
            <div className="text-[10px] font-cinematic text-amber-400 uppercase tracking-wider">SOURCE SENTENCE:</div>
            <p className="text-sm sm:text-base font-reading-en text-white font-bold leading-relaxed" dir="ltr">
              "{analysis.sentenceEn}"
            </p>

            {analysis.tensesUsed && analysis.tensesUsed.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs text-slate-400 font-reading-ar" dir="rtl">الأزمنة المستخدمة:</span>
                {analysis.tensesUsed.map((tense, idx) => (
                  <span key={idx} className="text-xs font-cinematic font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {tense}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Simplified Version if available */}
          {analysis.simplifiedVersionEn && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-reading-ar" dir="rtl">
                <Wand2 className="w-3.5 h-3.5" />
                <span>إعادة صياغة مبسطة للمبتدئين (B1 Level):</span>
              </div>
              <p className="text-xs sm:text-sm font-reading-en text-emerald-200" dir="ltr">
                "{analysis.simplifiedVersionEn}"
              </p>
            </div>
          )}

          {/* Syntactic Chunks Breakdown */}
          <div className="space-y-2" dir="rtl">
            <h4 className="text-xs font-bold text-amber-400 font-reading-ar flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الإعراب والتفكيك النحوي لأجزاء الجملة:</span>
            </h4>

            <div className="space-y-2.5">
              {analysis.breakdown && analysis.breakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#091326] border border-indigo-500/20 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-reading-en bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20" dir="ltr">
                      "{item.segment}"
                    </span>
                    <span className="text-[11px] font-cinematic font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-reading-ar leading-relaxed">
                    {item.explanationAr}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary / Takeaway */}
          {analysis.summaryAr && (
            <div className="p-3.5 bg-[#091326]/60 border border-indigo-500/20 rounded-2xl text-right" dir="rtl">
              <div className="text-[11px] text-slate-400 font-reading-ar mb-1 font-bold">خلاصة النمط النحوي:</div>
              <p className="text-xs text-slate-300 font-reading-ar leading-relaxed">
                {analysis.summaryAr}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#091326] border-t border-indigo-500/25 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinematic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
