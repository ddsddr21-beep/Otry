import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle, 
  BookOpen, 
  Trash2, 
  Clipboard, 
  CheckCircle2, 
  HelpCircle,
  X,
  Play,
  Layers,
  ArrowLeftRight,
  Wand2,
  FileText,
  Loader2,
  Feather,
  Crown,
  Brain,
  Languages,
  AlignLeft
} from 'lucide-react';
import { SentencePair, TextEvaluationReport, SavedWord } from '../types';
import TextEvaluationModal from './TextEvaluationModal';

interface Props {
  onAlign: (pairs: SentencePair[]) => void;
  onAddXP?: (amount: number, reason: string) => void;
  onSaveWord?: (word: Omit<SavedWord, 'id' | 'timestamp'>) => void;
  currentPairsCount?: number;
  onOpenReader?: () => void;
}

const SAMPLE_TEXTS = [
  {
    title: "The Little Prince",
    subtitle: "الأمير الصغير",
    author: "Antoine de Saint-Exupéry",
    marker: "#",
    badge: "كلاسيكيات الأدب الفرنسي",
    en: `# It is only with the heart that one can see rightly.
# What is essential is invisible to the eye.
# It is the time you have wasted for your rose that makes your rose so important.
# You become responsible forever for what you have tamed.
# The most beautiful things in the world cannot be seen or touched, they are felt with the heart.`,
    ar: `# لا يرى المرء الرؤية الصادقة إلا بقلبه.
# فالأشياء الجوهرية محجوبة عن أعيننا.
# إن الوقت الذي أضعته في سبيل وردتك هو ما جعلها في غاية الأهمية.
# أنت مسؤول إلى الأبد عن كل ما قمت بترويضه.
# إن أجمل الأشياء في هذا الوجود لا تُرى ولا تُلمس، بل يُشعر بها بالقلب.`
  },
  {
    title: "The Prophet",
    subtitle: "النبي",
    author: "Kahlil Gibran (جبران خليل جبران)",
    marker: "#",
    badge: "روائع الأدب العالمي",
    en: `# Your joy is your sorrow unmasked.
# And the selfsame well from which your laughter rises was oftentimes filled with your tears.
# The deeper that sorrow carves into your being, the more joy you can contain.
# Beauty is eternity gazing at itself in a mirror. But you are eternity and you are the mirror.`,
    ar: `# إن فرحكم ما هو إلا حزنكم وقد كُشف عنه القناع.
# والعين التي تفجر منها ضحكاتكم كانت مراراً ممتلئة بدموعكم.
# فكلما حفر الحزن عميقاً في كينونتكم، اتسعت أرواحكم لمزيد من الفرح.
# الجمال هو الأبدية تتأمل ذاتها في مرآة، بيد أنكم أنتم الأبدية وأنتم المرآة.`
  },
  {
    title: "The Old Man and the Sea",
    subtitle: "العجوز والبحر",
    author: "Ernest Hemingway",
    marker: "#",
    badge: "جائزة نوبل للآداب",
    en: `# He was an old man who fished alone in a skiff in the Gulf Stream.
# He had gone eighty-four days now without taking a fish.
# But man is not made for defeat.
# A man can be destroyed but not defeated.
# Now is no time to think of what you do not have; think of what you can do with what there is.`,
    ar: `# كان رجلاً عجوزاً يصيد وحيداً في قارب صغير وسط تيار الخليج.
# وقد مضت عليه أربعة وثمانون يوماً دون أن يصطاد سمكة واحدة.
# بيد أن الإنسان لم يُخلق للهزيمة.
# قد يُفنى الإنسان ولكن لا يُهزم أبداً.
# ليس هذا وقت التفكير فيما تفتقر إليه؛ فكر فيما يمكنك فعله بما تملكه الآن.`
  },
  {
    title: "Alice in Wonderland",
    subtitle: "أليس في بلاد العجائب",
    author: "Lewis Carroll",
    marker: "#",
    badge: "أدب الخيال العالمي",
    en: `# Curiosity often leads to the most wonderful adventures.
# It's no use going back to yesterday, because I was a different person then.
# If you don't know where you are going, any road will get you there.
# Who in the world am I? Ah, that's the great puzzle.`,
    ar: `# غالباً ما يقود الفضول إلى أروع المغامرات وأعظمها.
# لا فائدة من العودة إلى الأمس، لأنني كنت شخصاً مختلفاً حينها.
# إذا كنت لا تعرف إلى أين تتجه، فإن أي طريق سيوصلك إلى هناك.
# من أنا في هذا العالم بحق؟ آه، ذلك هو اللغز الأكبر.`
  }
];

export default function TextSetup({ onAlign, onAddXP, onSaveWord, currentPairsCount = 0, onOpenReader }: Props) {
  const [enText, setEnText] = useState(SAMPLE_TEXTS[0].en);
  const [arText, setArText] = useState(SAMPLE_TEXTS[0].ar);
  const [splitMode, setSplitMode] = useState<'marker' | 'lines' | 'sentences'>('marker');
  const [marker, setMarker] = useState('#');
  const [error, setError] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptFormat, setPromptFormat] = useState<'ar' | 'en'>('ar');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<TextEvaluationReport | null>(null);
  const [mobileInputTab, setMobileInputTab] = useState<'en' | 'ar' | 'both'>('en');

  // Parse sentences according to selected split mode
  const parseSegments = (text: string): string[] => {
    if (!text.trim()) return [];

    if (splitMode === 'marker') {
      if (!marker) return text.split('\n').map(s => s.trim()).filter(Boolean);
      return text.split(marker).map(s => s.trim()).filter(Boolean);
    } else if (splitMode === 'lines') {
      return text.split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
    } else {
      // Sentences mode
      return text.split(/([.!?؟]+["'”’]?\s+|\n+)/).map(s => s.trim()).filter(s => s.length > 2 && !/^[.!?؟\s]+$/.test(s));
    }
  };

  const enSentences = parseSegments(enText);
  const arSentences = parseSegments(arText);
  const isMatch = enSentences.length > 0 && enSentences.length === arSentences.length;

  const handleAlign = () => {
    setError('');

    if (enSentences.length === 0 || arSentences.length === 0) {
      setError('يرجى إدخال النصين الإنجليزي والعربي للمتابعة.');
      return;
    }

    if (enSentences.length !== arSentences.length) {
      setError(`عدم تطابق في عدد الفقرات: الإنجليزية (${enSentences.length}) والعربية (${arSentences.length}). اضغط على زر "AI AUTO-ALIGN" لمطابقتها تلقائياً.`);
      return;
    }

    const pairs: SentencePair[] = enSentences.map((en, idx) => ({
      id: `pair-${Date.now()}-${idx}`,
      en,
      ar: arSentences[idx]
    }));

    onAlign(pairs);
    onAddXP?.(30, `محاذاة نص جديد بنجاح (${pairs.length} فقرة)`);
  };

  const handleAiAutoAlign = async () => {
    if (!enText.trim() || !arText.trim()) {
      setError('يرجى إدخال النصين الإنجليزي والعربي أولاً للقيام بالمحاذاة الذكية.');
      return;
    }

    setIsAutoAligning(true);
    setError('');

    try {
      const res = await fetch('/api/gemini/auto-align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enText, arText })
      });

      const data = await res.json();
      if (data.pairs && Array.isArray(data.pairs) && data.pairs.length > 0) {
        const pairs: SentencePair[] = data.pairs.map((p: any, idx: number) => ({
          id: `pair-ai-${Date.now()}-${idx}`,
          en: p.en,
          ar: p.ar
        }));

        setSplitMode('marker');
        setMarker('#');
        setEnText(pairs.map(p => `# ${p.en}`).join('\n\n'));
        setArText(pairs.map(p => `# ${p.ar}`).join('\n\n'));

        onAlign(pairs);
        onAddXP?.(45, `تمت المحاذاة الذكية بالذكاء الاصطناعي (${pairs.length} فقرة)`);
      } else {
        throw new Error('لم يتمكن الذكاء الاصطناعي من تقسيم النصين بدقة، يرجى التحقق من المدخلات.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المحاذاة التلقائية. يمكنك استخدام رمز الفصل (#) يدوياً.');
    } finally {
      setIsAutoAligning(false);
    }
  };

  const handleEvaluateText = async () => {
    if (!enText.trim()) {
      setError('يرجى إدخال النص الإنجليزي لتقييمه وتحليله بالذكاء الاصطناعي.');
      return;
    }

    setIsEvaluating(true);
    setError('');

    try {
      const res = await fetch('/api/gemini/evaluate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enText, arText })
      });

      if (!res.ok) throw new Error('فشل تقييم النص، يرجى المحاولة لاحقاً');
      const report: TextEvaluationReport = await res.json();
      setEvaluationReport(report);
      onAddXP?.(35, `تقييم مستوى النص اللغوي (${report.cefrLevel})`);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تقييم النص.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSmartTranslate = async () => {
    if (!enText.trim()) {
      setError('يرجى إدخال النص الإنجليزي أولاً لتوليد الترجمة المتوازية.');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const res = await fetch('/api/gemini/smart-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enText, marker: splitMode === 'marker' ? marker : '#' })
      });

      if (!res.ok) throw new Error('فشل توليد الترجمة');
      const data = await res.json();
      if (data.arText) {
        setArText(data.arText);
        setSplitMode('marker');
        setMarker('#');
        onAddXP?.(40, `توليد ترجمة متوازية ذكية بنجاح`);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء توليد الترجمة.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFormatClean = async () => {
    if (!enText.trim()) {
      setError('يرجى إدخال النص لترتيبه وتنظيمه.');
      return;
    }

    setIsCleaning(true);
    setError('');

    try {
      const res = await fetch('/api/gemini/format-clean-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enText, arText, marker })
      });

      if (!res.ok) throw new Error('فشل ترتيب وتنسيق النص');
      const data = await res.json();
      if (data.formattedEn) {
        setEnText(data.formattedEn);
        if (data.formattedAr) setArText(data.formattedAr);
        setSplitMode('marker');
        setMarker('#');
        onAddXP?.(25, `تنسيق وترتيب النص تلقائياً`);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء ترتيب النص.');
    } finally {
      setIsCleaning(false);
    }
  };

  const loadSample = (sample: typeof SAMPLE_TEXTS[0]) => {
    setEnText(sample.en);
    setArText(sample.ar);
    setSplitMode('marker');
    setMarker(sample.marker);
    setError('');

    const enS = sample.en.split(sample.marker).map(s => s.trim()).filter(Boolean);
    const arS = sample.ar.split(sample.marker).map(s => s.trim()).filter(Boolean);
    const pairs: SentencePair[] = enS.map((en, idx) => ({
      id: `sample-${idx}`,
      en,
      ar: arS[idx]
    }));
    onAlign(pairs);
  };

  const swapTexts = () => {
    const temp = enText;
    setEnText(arText);
    setArText(temp);
  };

  const clearAll = () => {
    setEnText('');
    setArText('');
    setError('');
  };

  const pasteClipboard = async (target: 'en' | 'ar') => {
    try {
      const text = await navigator.clipboard.readText();
      if (target === 'en') setEnText(text);
      else setArText(text);
    } catch {
      // ignore
    }
  };

  const aiPromptTextArabic = `يرجى ترجمة النص الإنجليزي التالي إلى اللغة العربية فقرة بفقرة مع وضع الرمز (#) في بداية كل فقرة إنجليزية وبداية ترجمتها العربية المقابلة:

النص الإنجليزي:
[ألصق نصك هنا]

الصيغة المطلوبة:
# [الجملة الإنجليزية 1]
# [الجملة الإنجليزية 2]

وترجمتها:
# [الترجمة العربية 1]
# [الترجمة العربية 2]`;

  const aiPromptTextEnglish = `Please translate the following English text into Arabic sentence by sentence, prefixing every sentence in both languages with '#' so they pair 1:1:

English:
[Paste text here]

Format:
# [English 1]
# [English 2]

Arabic:
# [Arabic 1]
# [Arabic 2]`;

  const copyPromptToClipboard = () => {
    const textToCopy = promptFormat === 'ar' ? aiPromptTextArabic : aiPromptTextEnglish;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6" id="text-setup-container">
      
      {/* Top Banner & Fast Presets Bar */}
      <div className="bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.4)] flex flex-col gap-5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Feather className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-cinematic font-bold text-white uppercase tracking-wider">
                TEXT SYNCHRONIZATION STUDIO
              </h2>
              <span className="text-xs bg-amber-500/15 text-amber-300 font-cinematic px-2.5 py-0.5 rounded-full border border-amber-500/30">
                STUDIO PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300/80 font-reading-ar leading-relaxed" dir="rtl">
              أدخل نصك الإنجليزي وترجمته العربية المقابلة، أو اختر أحد الأعمال الأدبية الخالدة لبدء تجربة القراءة السينمائية.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-amber-300 border border-amber-500/30 text-xs font-cinematic font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI PROMPT HELPER</span>
            </button>

            {currentPairsCount > 0 && onOpenReader && (
              <button
                type="button"
                onClick={onOpenReader}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-cinematic font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 min-h-[48px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START READING ({currentPairsCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Cinematic Literary Presets Grid */}
        <div className="pt-4 border-t border-indigo-500/20">
          <div className="flex items-center justify-between mb-3" dir="rtl">
            <span className="text-xs text-amber-400 font-cinematic font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              مكتبة النصوص الكلاسيكية الجاهزة (Literary Classics)
            </span>
            <span className="text-[11px] text-slate-400 md:hidden font-reading-ar">اسحب للمزيد ←</span>
          </div>

          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 overflow-x-auto sm:overflow-visible no-scrollbar gap-3 pb-2 sm:pb-0 snap-x" dir="rtl">
            {SAMPLE_TEXTS.map((sample) => (
              <button
                type="button"
                key={sample.title}
                onClick={() => loadSample(sample)}
                className="p-3.5 rounded-2xl bg-[#070a12]/80 hover:bg-[#121c33] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col text-right gap-1 cursor-pointer group shadow-sm text-slate-200 hover:scale-[1.02] min-w-[240px] sm:min-w-0 snap-start shrink-0 sm:shrink touch-manipulation min-h-[48px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] text-amber-400/80 font-reading-ar bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {sample.badge}
                  </span>
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-reading-ar font-bold text-sm text-white mt-1">
                  {sample.subtitle}
                </div>
                <div className="text-[11px] text-slate-400 font-reading-en" dir="ltr">
                  {sample.title} — <span className="italic text-slate-500">{sample.author}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alignment Toolbar */}
      <div className="bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {/* Split Method Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-cinematic text-slate-400 font-bold uppercase tracking-wider">SPLIT METHOD:</span>
          <div className="flex bg-[#070a12] p-1 rounded-2xl border border-indigo-500/20">
            <button
              type="button"
              onClick={() => setSplitMode('marker')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold transition-all cursor-pointer min-h-[40px] ${
                splitMode === 'marker' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Marker ({marker})
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('lines')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold transition-all cursor-pointer min-h-[40px] ${
                splitMode === 'lines' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Line Breaks
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('sentences')}
              className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold transition-all cursor-pointer min-h-[40px] ${
                splitMode === 'sentences' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sentences (.?!)
            </button>
          </div>

          {splitMode === 'marker' && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-slate-400 font-cinematic">MARKER:</span>
              <input
                type="text"
                value={marker}
                onChange={(e) => setMarker(e.target.value)}
                maxLength={3}
                className="w-10 bg-[#070a12] border border-indigo-500/30 rounded-xl px-2 py-1 text-xs text-center font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* Counter and Utility Controls */}
        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-2 rounded-2xl text-xs font-cinematic font-bold flex items-center gap-2 border min-h-[48px] ${
            isMatch 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
              : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
          }`}>
            {isMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
            <span>EN: {enSentences.length} | AR: {arSentences.length}</span>
          </div>

          <button
            type="button"
            onClick={swapTexts}
            className="p-3 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-slate-300 hover:text-white border border-indigo-500/20 transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="تبديل النصين الإنجليزي والعربي"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="p-3 rounded-2xl bg-[#070a12] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-indigo-500/20 transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="مسح الحقول"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Assistance Toolbar for Text Processing */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0f172a]/80 border border-indigo-500/20 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-cinematic font-bold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>AI TEXT ASSISTANCE & ANALYSIS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Evaluate Text Button */}
          <button
            type="button"
            onClick={handleEvaluateText}
            disabled={isEvaluating || !enText.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-reading-ar font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
            title="تقييم صعوبة النص، الكلمات المعقدة، التراكيب، ومطابقة الترجمة"
          >
            {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Brain className="w-3.5 h-3.5 text-purple-400" />}
            <span>تقييم النص وتحليله (CEFR)</span>
          </button>

          {/* Smart AI Translation */}
          <button
            type="button"
            onClick={handleSmartTranslate}
            disabled={isTranslating || !enText.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-reading-ar font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
            title="توليد ترجمة عربية متوازية متطابقة بالرمز #"
          >
            {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Languages className="w-3.5 h-3.5 text-indigo-400" />}
            <span>توليد ترجمة متوازية</span>
          </button>

          {/* Format & Clean */}
          <button
            type="button"
            onClick={handleFormatClean}
            disabled={isCleaning || !enText.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-reading-ar font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
            title="تنظيم النص وتصحيح الفواصل ووضع علامات التقطيع تلقائياً"
          >
            {isCleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <AlignLeft className="w-3.5 h-3.5 text-emerald-400" />}
            <span>ترتيب وتنسيق الفواصل</span>
          </button>
        </div>
      </div>

      {/* Mobile Input Switcher Tabs */}
      <div className="md:hidden flex bg-[#070a12] p-1.5 rounded-2xl border border-indigo-500/20 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileInputTab('en')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 min-h-[48px] ${
            mobileInputTab === 'en'
              ? 'bg-indigo-600 text-white shadow-md font-cinematic'
              : 'text-slate-400 font-cinematic hover:text-white'
          }`}
        >
          <span>ENGLISH</span>
          <span className="text-[10px] opacity-80">({enSentences.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileInputTab('ar')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 min-h-[48px] ${
            mobileInputTab === 'ar'
              ? 'bg-indigo-600 text-white shadow-md font-reading-ar'
              : 'text-slate-400 font-reading-ar hover:text-white'
          }`}
        >
          <span>العربية</span>
          <span className="text-[10px] opacity-80">({arSentences.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileInputTab('both')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1.5 min-h-[48px] ${
            mobileInputTab === 'both'
              ? 'bg-indigo-600 text-white shadow-md font-reading-ar'
              : 'text-slate-400 font-reading-ar hover:text-white'
          }`}
        >
          <span>المزدوج</span>
        </button>
      </div>

      {/* Dual Text Input Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* English Column */}
        <div className={`bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl p-4 sm:p-6 flex-col gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
          mobileInputTab === 'ar' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-cinematic font-bold text-white uppercase tracking-wider">ENGLISH SOURCE TEXT</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pasteClipboard('en')}
                className="px-3 py-2 rounded-xl bg-[#070a12] hover:bg-[#121c33] border border-indigo-500/20 text-[11px] font-cinematic font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-[48px]"
              >
                <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                <span>PASTE</span>
              </button>
              <span className="text-xs font-cinematic text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {enSentences.length} items
              </span>
            </div>
          </div>

          <textarea
            value={enText}
            onChange={(e) => setEnText(e.target.value)}
            placeholder={`Enter English text... Use ${marker} at the start of each sentence/paragraph.`}
            className="w-full h-64 sm:h-80 bg-[#070a12]/80 border border-indigo-500/20 focus:border-indigo-400 rounded-2xl p-4 text-base font-reading-en text-[#f8fafc] leading-relaxed resize-none outline-none placeholder:text-slate-500"
            dir="ltr"
          />
        </div>

        {/* Arabic Column */}
        <div className={`bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl p-4 sm:p-6 flex-col gap-3 shadow-[0_10px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
          mobileInputTab === 'en' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20" dir="rtl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-reading-ar font-bold text-white">النص العربي المقابل</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pasteClipboard('ar')}
                className="px-3 py-2 rounded-xl bg-[#070a12] hover:bg-[#121c33] border border-indigo-500/20 text-[11px] font-reading-ar font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-[48px]"
              >
                <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                <span>لصق</span>
              </button>
              <span className="text-xs font-cinematic text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {arSentences.length} فقرة
              </span>
            </div>
          </div>

          <textarea
            value={arText}
            onChange={(e) => setArText(e.target.value)}
            placeholder={`أدخل النص العربي المقابل... ضع الرمز ${marker} في بداية كل جملة أو فقرة.`}
            className="w-full h-64 sm:h-80 bg-[#070a12]/80 border border-indigo-500/20 focus:border-indigo-400 rounded-2xl p-4 text-lg font-reading-ar text-[#f8fafc] leading-loose resize-none outline-none placeholder:text-slate-500 text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* Sticky Mobile Quick Sync Pill */}
      <div className="md:hidden sticky bottom-20 z-30 p-2.5 bg-[#0f172a]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex items-center justify-between gap-2 safe-bottom ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-cinematic text-amber-400 font-bold">EN: {enSentences.length}</span>
          <span className="text-slate-600">|</span>
          <span className="font-reading-ar text-amber-300 font-bold">AR: {arSentences.length}</span>
          {isMatch ? (
            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold">متطابق ✓</span>
          ) : (
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold">غير متطابق ⚠</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isMatch && (
            <button
              type="button"
              onClick={handleAiAutoAlign}
              disabled={isAutoAligning}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-cinematic font-bold flex items-center gap-1 touch-manipulation cursor-pointer min-h-[44px]"
            >
              {isAutoAligning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span>ALIGN</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAlign}
            disabled={enSentences.length === 0 || arSentences.length === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-cinematic font-black text-xs uppercase flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>SYNC & READ</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/40 rounded-3xl text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in" dir="rtl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span className="font-reading-ar">{error}</span>
          </div>
          <button
            type="button"
            onClick={handleAiAutoAlign}
            disabled={isAutoAligning}
            className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-reading-ar font-bold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all touch-manipulation min-h-[48px]"
          >
            {isAutoAligning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>إصلاح بالمحاذاة الذكية</span>
          </button>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="text-xs sm:text-sm text-slate-300 font-reading-ar text-center sm:text-right w-full sm:w-auto" dir="rtl">
          {isMatch ? (
            <span className="text-emerald-400 font-bold">✓ النصوص متطابقة ومجهزة لبدء القراءة السينمائية!</span>
          ) : (
            <span>تأكد من تساوي عدد الفقرات أو انقر على المحاذاة التلقائية بالذكاء الاصطناعي.</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleEvaluateText}
              disabled={isEvaluating || !enText.trim()}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-purple-300 border border-purple-500/30 font-reading-ar font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Brain className="w-4 h-4 text-purple-400" />}
              <span>تقييم النص</span>
            </button>

            <button
              type="button"
              onClick={handleAiAutoAlign}
              disabled={isAutoAligning}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-amber-300 border border-amber-500/30 font-cinematic font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md touch-manipulation min-h-[48px]"
              title="تقسيم ومطابقة النصوص تلقائياً بالذكاء الاصطناعي"
            >
              {isAutoAligning ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Wand2 className="w-4 h-4 text-amber-400" />}
              <span>AUTO-ALIGN</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAlign}
            disabled={enSentences.length === 0 || arSentences.length === 0}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-cinematic font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[48px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>SYNC & START READING</span>
          </button>
        </div>
      </div>

      {/* Evaluation Modal */}
      {evaluationReport && (
        <TextEvaluationModal
          report={evaluationReport}
          onClose={() => setEvaluationReport(null)}
          onSaveWord={onSaveWord}
          onAddXP={onAddXP}
        />
      )}

      {/* AI Prompt Generator Modal (Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="w-full sm:max-w-xl bg-[#0f172a] rounded-t-3xl sm:rounded-3xl border border-indigo-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] text-[#f1f5f9] safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-600/50 mx-auto mt-2.5 sm:hidden" />
            <div className="p-5 sm:p-6 border-b border-indigo-500/20 flex items-center justify-between bg-[#070a12]/80">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold text-white font-cinematic uppercase tracking-wider">
                  AI Translation Prompt Helper
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed font-reading-ar" dir="rtl">
                انسخ هذا الطلب وألصقه في ChatGPT أو Gemini مع أي مقال أو كتاب تريده لإنشاء ترجمة متوازية متطابقة بدقة 1:1 جاهزة للقراءة الفورية:
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromptFormat('ar')}
                  className={`flex-1 py-3 rounded-xl text-xs font-reading-ar font-bold cursor-pointer transition-all touch-manipulation min-h-[48px] ${
                    promptFormat === 'ar' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-[#070a12] text-slate-400'
                  }`}
                >
                  الطلب بالعربية
                </button>
                <button
                  type="button"
                  onClick={() => setPromptFormat('en')}
                  className={`flex-1 py-3 rounded-xl text-xs font-cinematic font-bold cursor-pointer transition-all touch-manipulation min-h-[48px] ${
                    promptFormat === 'en' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-[#070a12] text-slate-400'
                  }`}
                >
                  English Prompt
                </button>
              </div>

              <div className="bg-[#070a12] p-4 rounded-2xl border border-indigo-500/20 font-mono text-[11px] text-slate-200 whitespace-pre-wrap select-all leading-relaxed max-h-48 overflow-y-auto">
                {promptFormat === 'ar' ? aiPromptTextArabic : aiPromptTextEnglish}
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#070a12]/80 border-t border-indigo-500/20 flex justify-between items-center gap-3">
              <span className="text-[11px] text-slate-400 font-cinematic truncate">
                {copiedPrompt ? "COPIED TO CLIPBOARD!" : "READY TO COPY"}
              </span>
              <button
                type="button"
                onClick={copyPromptToClipboard}
                className="px-5 sm:px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinematic font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/25 touch-manipulation min-h-[48px]"
              >
                {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPrompt ? "COPIED" : "COPY PROMPT"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

