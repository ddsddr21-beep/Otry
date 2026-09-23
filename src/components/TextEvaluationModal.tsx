import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Award, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  FileText, 
  GraduationCap, 
  Zap, 
  BookmarkPlus, 
  Check, 
  TrendingUp,
  Brain,
  HelpCircle,
  Quote,
  Activity,
  Layers
} from 'lucide-react';
import { TextEvaluationReport, SavedWord } from '../types';

interface Props {
  report: TextEvaluationReport;
  onClose: () => void;
  onSaveWord?: (word: Omit<SavedWord, 'id' | 'timestamp'>) => void;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function TextEvaluationModal({ report, onClose, onSaveWord, onAddXP }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'vocab' | 'grammar' | 'tips'>('overview');
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});

  const handleSaveWord = (word: string, meaningAr: string) => {
    if (onSaveWord) {
      onSaveWord({
        word,
        meaningAr,
        contextEn: `Extracted from evaluated reading text.`,
        contextAr: `مستخرجة من النص المقروء الذي تم تقييمه.`,
        partOfSpeech: 'Vocabulary',
        listId: 'default'
      });
      setSavedWords(prev => ({ ...prev, [word]: true }));
      onAddXP?.(15, `حفظ كلمة "${word}" من تقييم النص`);
    }
  };

  const getCefrBadgeColor = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'B1':
      case 'B2':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'C1':
      case 'C2':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-[#0e1c38] border border-amber-500/35 rounded-t-[32px] sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh] overflow-hidden text-slate-100 ring-1 ring-amber-400/20 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#091326] border-b border-indigo-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-cinematic font-bold text-white uppercase tracking-wider">
                  AI TEXT EVALUATION & INSIGHTS
                </h3>
                <span className={`text-xs font-cinematic font-bold px-2.5 py-0.5 rounded-full border ${getCefrBadgeColor(report.cefrLevel)}`}>
                  {report.cefrLevel} LEVEL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-reading-ar" dir="rtl">
                تقرير شامل لتقييم الصعوبة اللغوية، ثراء المفردات، وجودة الترجمة
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#091326]/60 border-b border-indigo-500/20 text-center">
          <div className="p-3 bg-[#0e1c38] rounded-2xl border border-indigo-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-reading-ar mb-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>مستوى النص</span>
            </div>
            <span className="text-sm font-bold text-amber-300 font-cinematic">{report.cefrLevel} ({report.cefrTitleAr.split(' ')[0]})</span>
          </div>

          <div className="p-3 bg-[#0e1c38] rounded-2xl border border-indigo-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-reading-ar mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>مؤشر السلاسة</span>
            </div>
            <span className="text-sm font-bold text-emerald-300 font-cinematic">{report.readabilityScore} / 100</span>
          </div>

          <div className="p-3 bg-[#0e1c38] rounded-2xl border border-indigo-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-reading-ar mb-0.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>الكلمات الفريدة</span>
            </div>
            <span className="text-sm font-bold text-blue-300 font-cinematic">{report.uniqueWords} / {report.totalWords}</span>
          </div>

          <div className="p-3 bg-[#0e1c38] rounded-2xl border border-indigo-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-reading-ar mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>دقة الترجمة</span>
            </div>
            <span className="text-sm font-bold text-purple-300 font-cinematic">{report.translationQualityScore}%</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-around px-4 pt-3 bg-[#0e1c38] border-b border-indigo-500/20 text-xs font-cinematic font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            نظرة عامة والتقييم
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vocab'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>المفردات والتعبيرات</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              {(report.keyIdioms?.length || 0) + (report.challengingVocabulary?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'grammar'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            التراكيب والقواعد ({report.grammarHighlights?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tips'
                ? 'border-amber-400 text-amber-300 font-black'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            خطة التعلّم
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <AnimatePresence mode="wait">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div 
                key="tab-overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4" 
                dir="rtl"
              >
                {/* Style and Literary Tone Badge */}
                {report.literaryToneAr && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-indigo-950/40 to-amber-500/5 border border-amber-500/25 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Quote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-amber-300/80 font-reading-ar">النمط الأدبي والأسلوب:</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-200 font-reading-ar">
                        {report.literaryToneAr}
                      </div>
                    </div>
                  </div>
                )}

                {/* Level & Readiness Card */}
                <div className="p-4 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-reading-ar">التقييم الشامل للمستوى:</span>
                    <span className="text-xs font-bold font-reading-ar text-amber-300 bg-amber-500/15 px-3 py-0.5 rounded-full border border-amber-500/30">
                      {report.cefrTitleAr}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-reading-ar leading-relaxed">
                    {report.readabilityLevelAr}. يقدر متوسط وقت القراءة والاستيعاب بحوالي <span className="text-amber-300 font-bold">{report.readingTimeMinutes} دقيقة</span>.
                  </p>
                </div>

                {/* Translation Fidelity Notes */}
                <div className="p-4 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-reading-ar">ملاحظات دقة وجودة الترجمة المقابلة:</span>
                    <span className="text-xs font-cinematic font-bold text-emerald-400">
                      {report.translationQualityScore}% توافق لغوي
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-reading-ar leading-relaxed">
                    {report.translationQualityNotesAr}
                  </p>
                </div>

                {/* Sentence and Lexical Structure Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-1 text-right">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-reading-ar">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>متوسط طول الجملة:</span>
                    </div>
                    <div className="text-sm font-bold text-white font-cinematic">
                      {report.avgSentenceLength || Math.round(report.totalWords / 4)} كلمة / جملة
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-1 text-right">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-reading-ar">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>معدل تنوع الكلمات:</span>
                    </div>
                    <div className="text-sm font-bold text-amber-300 font-cinematic">
                      {report.lexicalDiversityPercent || Math.round((report.uniqueWords / (report.totalWords || 1)) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Lexical Density Progress Bar */}
                <div className="p-4 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-reading-ar">الكثافة المعجمية (Lexical Richness):</span>
                    <span className="text-amber-300 font-bold font-cinematic">
                      {report.lexicalDiversityPercent || Math.round((report.uniqueWords / (report.totalWords || 1)) * 100)}% تنوع مفردات
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, report.lexicalDiversityPercent || ((report.uniqueWords / (report.totalWords || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: VOCABULARY & IDIOMS */}
            {activeTab === 'vocab' && (
              <motion.div 
                key="tab-vocab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4" 
                dir="rtl"
              >
                {/* Idioms & Phrasal Verbs */}
                {report.keyIdioms && report.keyIdioms.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-amber-400 font-reading-ar flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تعبيرات اصطلاحية وأفعال مركبة (Idioms & Phrasal Verbs):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {report.keyIdioms.map((idiom, idx) => (
                        <div key={idx} className="p-3 bg-[#091326] border border-indigo-500/25 rounded-2xl flex flex-col justify-between gap-2 text-right">
                          <div>
                            <div className="text-sm font-bold font-reading-en text-white" dir="ltr">
                              {idiom.phrase}
                            </div>
                            <div className="text-xs font-reading-ar text-amber-300 mt-1">
                              {idiom.meaningAr}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => handleSaveWord(idiom.phrase, idiom.meaningAr)}
                              disabled={savedWords[idiom.phrase]}
                              className={`text-[11px] px-2.5 py-1 rounded-xl font-reading-ar flex items-center gap-1 transition-all cursor-pointer ${
                                savedWords[idiom.phrase]
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {savedWords[idiom.phrase] ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                              <span>{savedWords[idiom.phrase] ? 'تم الحفظ' : 'حفظ بالمفردات'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenging Vocabulary List */}
                {report.challengingVocabulary && report.challengingVocabulary.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-amber-400 font-reading-ar flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>أهم المفردات المتقدمة في هذا النص:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {report.challengingVocabulary.map((vocab, idx) => (
                        <div key={idx} className="p-3 bg-[#091326] border border-indigo-500/25 rounded-2xl flex items-center justify-between gap-2">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-reading-en text-white" dir="ltr">
                                {vocab.word}
                              </span>
                              <span className="text-[10px] font-cinematic font-bold px-2 py-0.2 rounded-md bg-white/5 text-amber-300 border border-white/10">
                                {vocab.cefr}
                              </span>
                            </div>
                            <div className="text-xs font-reading-ar text-slate-300 mt-1">
                              {vocab.meaningAr}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveWord(vocab.word, vocab.meaningAr)}
                            disabled={savedWords[vocab.word]}
                            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                              savedWords[vocab.word]
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                            }`}
                            title="حفظ الكلمة في بنك المفردات"
                          >
                            {savedWords[vocab.word] ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: GRAMMAR HIGHLIGHTS */}
            {activeTab === 'grammar' && (
              <motion.div 
                key="tab-grammar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3" 
                dir="rtl"
              >
                {report.grammarHighlights && report.grammarHighlights.length > 0 ? (
                  report.grammarHighlights.map((gh, idx) => (
                    <div key={idx} className="p-4 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 font-cinematic uppercase tracking-wider" dir="ltr">
                          {gh.structure}
                        </span>
                        <span className="text-[10px] font-cinematic text-slate-400">نمط #{idx + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 font-reading-ar leading-relaxed">
                        {gh.explanationAr}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 font-reading-ar text-xs">
                    لا توجد تراكيب نحوية معقدة مسجلة في هذا النص.
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: STUDY ROADMAP */}
            {activeTab === 'tips' && (
              <motion.div 
                key="tab-tips"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-3" 
                dir="rtl"
              >
                <div className="text-xs text-slate-400 font-reading-ar">
                  خطة موجهة لتحقيق أقصى استفادة تعليمية من قراءة هذا النص:
                </div>

                {report.learnerRecommendationsAr && report.learnerRecommendationsAr.map((tip, idx) => (
                  <div key={idx} className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-cinematic font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 font-reading-ar leading-relaxed">
                      {tip}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#091326] border-t border-indigo-500/25 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-reading-ar" dir="rtl">
            تم التقييم اللغوي بواسطة Gemini AI
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinematic font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            حسناً، فهمت
          </button>
        </div>
      </motion.div>
    </div>
  );
}
