import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SentencePair, ViewMode, ReaderSettings, SavedWord, WordList, SentenceGrammarAnalysis, TextEvaluationReport } from '../types';
import WordPopup from './WordPopup';
import SentenceGrammarModal from './SentenceGrammarModal';
import TextEvaluationModal from './TextEvaluationModal';
import { 
  Volume2, 
  Loader2, 
  BookOpen, 
  Sparkles, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Brain, 
  X,
  Maximize2,
  Minimize2,
  Settings2,
  PanelTop,
  SplitSquareVertical,
  SplitSquareHorizontal,
  Moon,
  Coffee,
  Sun,
  Eye,
  Type,
  ArrowUp
} from 'lucide-react';

interface Props {
  pairs: SentencePair[];
  viewMode: ViewMode;
  settings: ReaderSettings;
  onSaveWord: (word: Omit<SavedWord, 'id' | 'timestamp'>) => void;
  wordLists: WordList[];
  onAddXP?: (amount: number, reason: string, statType?: 'sentencesRead' | 'wordsLookedUp' | 'wordsSaved' | 'pronunciationsPracticed') => void;
  onToggleBookmark?: (pairId: string) => void;
  onClose?: () => void;
  onUpdateSettings?: (updater: (prev: ReaderSettings) => ReaderSettings) => void;
  onUpdateViewMode?: (mode: ViewMode) => void;
}

export default function Reader({ 
  pairs, 
  viewMode: initialViewMode, 
  settings: initialSettings, 
  onSaveWord, 
  wordLists, 
  onAddXP,
  onToggleBookmark,
  onClose,
  onUpdateSettings,
  onUpdateViewMode
}: Props) {
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(initialViewMode);
  const [currentSettings, setCurrentSettings] = useState<ReaderSettings>(initialSettings);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [hoveredSentenceId, setHoveredSentenceId] = useState<string | null>(null);
  const [selectedWordData, setSelectedWordData] = useState<{
    word: string;
    contextEn: string;
    contextAr: string;
    sentenceId: string;
    anchorRect?: DOMRect | null;
  } | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [revealedSentences, setRevealedSentences] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [grammarAnalysis, setGrammarAnalysis] = useState<SentenceGrammarAnalysis | null>(null);
  const [isAnalyzingGrammar, setIsAnalyzingGrammar] = useState<string | null>(null);
  const [evaluationReport, setEvaluationReport] = useState<TextEvaluationReport | null>(null);
  const [isEvaluatingText, setIsEvaluatingText] = useState<boolean>(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync internal state when parent props change
  useEffect(() => {
    setCurrentViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    setCurrentSettings(initialSettings);
  }, [initialSettings]);

  // Semi-Long Press (Hold for ~350ms) State & Timer
  const [pressingWordKey, setPressingWordKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const preventNextClickRef = useRef<boolean>(false);

  const sentenceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut listener: ESC to close popup, Arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedWordData) {
          setSelectedWordData(null);
        } else if (grammarAnalysis) {
          setGrammarAnalysis(null);
        } else if (evaluationReport) {
          setEvaluationReport(null);
        } else if (showQuickSettings) {
          setShowQuickSettings(false);
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        if (!selectedWordData && !grammarAnalysis && !evaluationReport) {
          scrollToSentence(Math.min(pairs.length - 1, activeSentenceIndex + 1));
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (!selectedWordData && !grammarAnalysis && !evaluationReport) {
          scrollToSentence(Math.max(0, activeSentenceIndex - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSentenceIndex, pairs.length, selectedWordData, grammarAnalysis, evaluationReport, showQuickSettings, onClose]);

  const updateSetting = (key: keyof ReaderSettings, val: any) => {
    const updated = { ...currentSettings, [key]: val };
    setCurrentSettings(updated);
    if (onUpdateSettings) {
      onUpdateSettings(prev => ({ ...prev, [key]: val }));
    }
  };

  const changeViewMode = (mode: ViewMode) => {
    setCurrentViewMode(mode);
    if (onUpdateViewMode) {
      onUpdateViewMode(mode);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const triggerWordLookup = (element: HTMLElement, word: string, pair: SentencePair) => {
    const cleanWord = word.replace(/[.,!?;:()[\]{}"'“”‘’—\n]/g, '').trim();
    if (!cleanWord || cleanWord.length < 2) return;

    const rect = element.getBoundingClientRect();
    setSelectedWordData({
      word: cleanWord,
      contextEn: pair.en,
      contextAr: pair.ar,
      sentenceId: pair.id,
      anchorRect: rect
    });

    onAddXP?.(5, `فحص كلمة "${cleanWord}" في القاموس`, 'wordsLookedUp');
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>, tokenKey: string, word: string, pair: SentencePair) => {
    if (e.button !== 0) return;
    const targetElement = e.currentTarget;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    setPressingWordKey(tokenKey);
    preventNextClickRef.current = false;

    longPressTimerRef.current = window.setTimeout(() => {
      triggerWordLookup(targetElement, word, pair);
      setPressingWordKey(null);
      preventNextClickRef.current = true;
    }, 350);
  };

  const handlePointerUpOrCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPressingWordKey(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLElement>, word: string, pair: SentencePair) => {
    e.stopPropagation();
    triggerWordLookup(e.currentTarget, word, pair);
  };

  const closePopup = () => {
    setSelectedWordData(null);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        onAddXP?.(10, 'حفظ فقرة في الإشارات المرجعية');
      }
      return next;
    });
    onToggleBookmark?.(id);
  };

  const copySentencePair = (pair: SentencePair, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${pair.en}\n${pair.ar}`);
    setCopiedId(pair.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const playSentence = async (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    if (playingId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    setPlayingId(id);
    onAddXP?.(5, 'الاستماع لنطق الجملة', 'sentencesRead');

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.playbackRate = speechRate;
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => fallbackSentenceSpeech(text);
        await audio.play();
      } else {
        fallbackSentenceSpeech(text);
      }
    } catch {
      fallbackSentenceSpeech(text);
    }
  };

  const fallbackSentenceSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  const handleAnalyzeGrammar = async (pair: SentencePair, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnalyzingGrammar) return;

    setIsAnalyzingGrammar(pair.id);
    try {
      const res = await fetch('/api/gemini/analyze-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentenceEn: pair.en, sentenceAr: pair.ar })
      });
      const data = await res.json();
      setGrammarAnalysis(data);
      onAddXP?.(20, 'إعراب وتحليل البنية النحوية للجملة');
    } catch {
      setGrammarAnalysis({
        sentenceEn: pair.en,
        tensesUsed: ["Sentence Syntax"],
        breakdown: [
          { segment: pair.en, role: "Main Clause", explanationAr: "جملة متكاملة المعنى تشتمل على مسند ومسند إليه." }
        ],
        keyVocabulary: [],
        summaryAr: "تحليل مباشر للجملة وسياقها."
      });
    } finally {
      setIsAnalyzingGrammar(null);
    }
  };

  const handleEvaluateFullText = async () => {
    if (isEvaluatingText || pairs.length === 0) return;
    setIsEvaluatingText(true);

    const fullEn = pairs.map(p => p.en).join('\n\n');
    const fullAr = pairs.map(p => p.ar).join('\n\n');

    try {
      const res = await fetch('/api/gemini/evaluate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enText: fullEn, arText: fullAr })
      });
      const data: TextEvaluationReport = await res.json();
      setEvaluationReport(data);
      onAddXP?.(30, `فحص وتقييم شامل للنص المقروء (${data.cefrLevel})`);
    } catch {
      // Ignore
    } finally {
      setIsEvaluatingText(false);
    }
  };

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedSentences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSentence = (index: number) => {
    if (index < 0 || index >= pairs.length) return;
    setActiveSentenceIndex(index);
    const targetPair = pairs[index];
    if (targetPair && sentenceRefs.current[targetPair.id]) {
      sentenceRefs.current[targetPair.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getFontFamilyClassEn = () => {
    switch (currentSettings.fontFamily) {
      case 'editorial':
        return 'font-editorial-serif tracking-normal';
      case 'sans':
        return 'font-modern-sans tracking-normal';
      case 'literary':
      case 'serif':
      default:
        return 'font-literary tracking-wide';
    }
  };

  const getFontFamilyClassAr = () => {
    switch (currentSettings.arabicFont) {
      case 'amiri':
        return 'font-amiri-ar';
      case 'naskh':
      default:
        return 'font-naskh-ar';
    }
  };

  const getFontSizeClassesEn = () => {
    switch (currentSettings.fontSize) {
      case 'small': return 'text-base md:text-lg leading-[1.85]';
      case 'large': return 'text-xl md:text-2xl leading-[1.95]';
      case 'xlarge': return 'text-2xl md:text-3xl leading-[2]';
      case 'medium':
      default: return 'text-lg md:text-xl leading-[1.9]';
    }
  };

  const getFontSizeClassesAr = () => {
    switch (currentSettings.fontSize) {
      case 'small': return 'text-lg md:text-xl leading-[2.2]';
      case 'large': return 'text-2xl md:text-3xl leading-[2.4]';
      case 'xlarge': return 'text-3xl md:text-4xl leading-[2.5]';
      case 'medium':
      default: return 'text-xl md:text-2xl leading-[2.3]';
    }
  };

  const getEnglishTextColor = () => {
    switch (currentSettings.theme) {
      case 'parchment': return 'text-[#1c1209] font-medium';
      case 'emerald': return 'text-[#f0fdf4] font-medium';
      case 'obsidian': return 'text-[#fdf4ff] font-medium';
      case 'midnight':
      default: return 'text-[#f8fafc] font-normal sm:font-medium';
    }
  };

  const getLineSpacingClass = () => {
    switch (currentSettings.lineSpacing) {
      case 'loose': return 'space-y-12 sm:space-y-16';
      case 'relaxed': return 'space-y-10 sm:space-y-12';
      case 'normal':
      default: return 'space-y-8 sm:space-y-10';
    }
  };

  // Background atmosphere of the entire full-screen pop-up viewport
  const getViewportBackdropClass = () => {
    switch (currentSettings.theme) {
      case 'parchment':
        return 'bg-[#21160d]/90 text-[#1e293b]';
      case 'emerald':
        return 'bg-[#020b08]/95 text-[#ecfdf5]';
      case 'obsidian':
        return 'bg-[#0d0413]/95 text-[#fae8ff]';
      case 'midnight':
      default:
        return 'bg-[#040813]/95 text-[#f1f5f9]';
    }
  };

  // The Grand Continuous Paper Sheet Styling (ورقة قراءة طويلة ككتاب أو مخطوطة)
  const getPaperSheetClasses = () => {
    switch (currentSettings.theme) {
      case 'parchment':
        return 'bg-[#fcfaf5] text-[#1c1209] border border-[#e5dcce] shadow-[0_25px_80px_rgba(0,0,0,0.45)] ring-1 ring-amber-900/10';
      case 'emerald':
        return 'bg-[#071a15] text-[#ecfdf5] border border-emerald-500/25 shadow-[0_25px_80px_rgba(0,0,0,0.65)] ring-1 ring-emerald-500/15';
      case 'obsidian':
        return 'bg-[#180b22] text-[#fae8ff] border border-purple-500/25 shadow-[0_25px_80px_rgba(0,0,0,0.65)] ring-1 ring-purple-500/15';
      case 'midnight':
      default:
        return 'bg-[#0b162e] text-[#f8fafc] border border-indigo-500/30 shadow-[0_25px_80px_rgba(0,0,0,0.7)] ring-1 ring-indigo-500/20';
    }
  };

  const getArabicTextColor = () => {
    switch (currentSettings.theme) {
      case 'parchment': return 'text-[#854d0e] font-medium';
      case 'emerald': return 'text-[#6ee7b7] font-medium';
      case 'obsidian': return 'text-[#f472b6] font-medium';
      case 'midnight':
      default: return 'text-[#93c5fd] font-medium';
    }
  };

  const getParchmentDividerColor = () => {
    switch (currentSettings.theme) {
      case 'parchment': return 'border-amber-900/15';
      case 'emerald': return 'border-emerald-500/20';
      case 'obsidian': return 'border-purple-500/20';
      case 'midnight':
      default: return 'border-indigo-500/20';
    }
  };

  const getFloatingBarClasses = () => {
    switch (currentSettings.theme) {
      case 'parchment':
        return 'bg-[#f7f2e8]/95 border-amber-800/20 text-[#1e293b] shadow-2xl';
      case 'emerald':
        return 'bg-[#08201a]/95 border-emerald-500/30 text-[#ecfdf5] shadow-2xl';
      case 'obsidian':
        return 'bg-[#1f0f2c]/95 border-purple-500/30 text-[#fae8ff] shadow-2xl';
      case 'midnight':
      default:
        return 'bg-[#0e1c38]/95 border-indigo-500/30 text-[#f1f5f9] shadow-2xl';
    }
  };

  const getSubButtonClasses = () => {
    switch (currentSettings.theme) {
      case 'parchment': return 'bg-[#eae0d0] hover:bg-[#ded1bd] text-amber-950 border-amber-800/15';
      case 'emerald': return 'bg-[#0a2720] hover:bg-[#0e352c] text-emerald-200 border-emerald-500/25';
      case 'obsidian': return 'bg-[#29133a] hover:bg-[#381a4f] text-pink-200 border-purple-500/25';
      case 'midnight':
      default: return 'bg-[#122347] hover:bg-[#1a3160] text-slate-200 border-indigo-500/25';
    }
  };

  const renderEnglishTokens = (pair: SentencePair) => {
    return pair.en.split(/(\s+|[.,!?;:()[\]{}"'“”‘’—]+)/).map((token, i) => {
      const isWord = /^[a-zA-Z0-9'-]+$/.test(token);
      if (!isWord) {
        return <span key={i} className="opacity-60">{token}</span>;
      }

      const tokenKey = `${pair.id}-${i}-${token}`;
      const isWordSelected = selectedWordData?.word.toLowerCase() === token.toLowerCase() && selectedWordData?.sentenceId === pair.id;
      const isHolding = pressingWordKey === tokenKey;

      let wordClass = '';
      if (isWordSelected) {
        wordClass = 'bg-amber-500/35 text-amber-300 font-bold underline decoration-amber-400 decoration-2 underline-offset-4 shadow-sm ring-1 ring-amber-400/50';
      } else if (isHolding) {
        wordClass = 'bg-amber-500/50 text-amber-100 ring-2 ring-amber-300 scale-110 shadow-lg shadow-amber-500/40 z-10';
      } else {
        wordClass = 'hover:bg-amber-400/20 hover:text-amber-300 active:bg-amber-400/35 active:scale-95 transition-all rounded-md';
      }

      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (!preventNextClickRef.current) {
              triggerWordLookup(e.currentTarget, token, pair);
            }
          }}
          onPointerDown={(e) => handlePointerDown(e, tokenKey, token, pair)}
          onPointerUp={handlePointerUpOrCancel}
          onPointerLeave={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onDoubleClick={(e) => handleDoubleClick(e, token, pair)}
          onContextMenu={(e) => {
            e.preventDefault();
            triggerWordLookup(e.currentTarget, token, pair);
          }}
          className={`cursor-pointer inline-block px-1 py-0.5 my-0.5 duration-150 select-none touch-manipulation active:scale-95 ${wordClass}`}
          title="انقر أو اضغط مطولاً للترجمة والتحليل المعجمي"
        >
          {token}
        </span>
      );
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      ref={readerContainerRef}
      className={`fixed inset-0 z-50 overflow-y-auto ${getViewportBackdropClass()} backdrop-blur-2xl flex flex-col transition-colors duration-300`}
      onClick={closePopup}
      dir="ltr"
    >
      {/* Top Floating Sanctuary Header Bar */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-all ${getFloatingBarClasses()} px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xl`}>
        
        {/* Left Controls: Exit Button & Progress Details */}
        <div className="flex items-center gap-3">
          {/* Close/Exit Reading Sanctuary Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-cinematic font-bold tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق والعودة إلى الصفحة الرئيسية [Esc]"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">EXIT READER</span>
            <kbd className="hidden md:inline-block text-[10px] bg-rose-950/60 px-1.5 py-0.5 rounded text-rose-300 border border-rose-500/30">ESC</kbd>
          </button>

          {/* Passage Progress Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border bg-black/20 border-white/10">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-cinematic font-bold text-xs shrink-0">
              {activeSentenceIndex + 1}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[11px] font-cinematic font-bold tracking-wider">
                SECTION {activeSentenceIndex + 1} / {pairs.length}
              </span>
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${((activeSentenceIndex + 1) / pairs.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: View Modes Switcher */}
        <div className="flex items-center bg-black/20 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => changeViewMode('split-horizontal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentViewMode === 'split-horizontal' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="قراءة متوازية ثنائية (Dual Stacked Flow)"
          >
            <PanelTop className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DUAL FLOW</span>
          </button>

          <button
            type="button"
            onClick={() => changeViewMode('split-vertical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentViewMode === 'split-vertical' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="عمودان متوازيان كصفحة كتاب (Side-by-Side Manuscript)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">COLUMNS</span>
          </button>

          <button
            type="button"
            onClick={() => changeViewMode('english-only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-cinematic font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentViewMode === 'english-only' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="نص إنجليزي متصل مع كشف الترجمة عند الطلب (Reveal on Demand)"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">FOCUS & REVEAL</span>
          </button>
        </div>

        {/* Right Controls: Evaluation, Audio Speed, Steppers & Settings */}
        <div className="flex items-center gap-2">
          {/* Quick Evaluate Button */}
          <button
            type="button"
            onClick={handleEvaluateFullText}
            disabled={isEvaluatingText}
            className={`px-3 py-1.5 rounded-2xl ${getSubButtonClasses()} hover:border-purple-400/50 text-purple-300 text-xs font-reading-ar font-bold flex items-center gap-1.5 transition-all cursor-pointer border`}
            title="تقييم شامل لمستوى وصعوبة ومفردات النص المقروء"
          >
            {isEvaluatingText ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Brain className="w-3.5 h-3.5 text-purple-400" />}
            <span className="hidden sm:inline">تقييم النص</span>
          </button>

          {/* Steppers */}
          <div className="hidden lg:flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => scrollToSentence(Math.max(0, activeSentenceIndex - 1))}
              disabled={activeSentenceIndex === 0}
              className="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              title="الفقرة السابقة (السهم لأعلى)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSentence(Math.min(pairs.length - 1, activeSentenceIndex + 1))}
              disabled={activeSentenceIndex === pairs.length - 1}
              className="p-1.5 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              title="الفقرة التالية (السهم لأسفل)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Reading Settings Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickSettings(!showQuickSettings)}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                showQuickSettings
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : `${getSubButtonClasses()}`
              }`}
              title="تخصيص المظهر، الخطوط، وتجربة القراءة"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Quick Settings Dropdown (Popover on Desktop, Bottom Sheet on Mobile) */}
            <AnimatePresence>
              {showQuickSettings && (
                <div 
                  className="fixed inset-0 sm:inset-auto sm:absolute sm:right-0 sm:top-full z-50 flex items-end sm:items-start justify-center sm:justify-end bg-black/75 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-0 sm:p-0"
                  onClick={() => setShowQuickSettings(false)}
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full sm:w-92 bg-[#0f172a] rounded-t-[32px] sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-indigo-500/25 p-5 z-50 space-y-4 text-xs text-[#f1f5f9] max-h-[85vh] overflow-y-auto pb-safe ring-1 ring-white/10 backdrop-blur-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Mobile Sheet Drag Indicator */}
                    <div className="w-12 h-1.5 bg-slate-600/50 rounded-full mx-auto mb-2 sm:hidden" />

                    <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-cinematic font-bold text-white tracking-wider">READING ENVIRONMENT</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowQuickSettings(false)} 
                        className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        PAPER THEME (نوع الورقة والأجواء)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-[#070a12] rounded-2xl p-1.5 border border-indigo-500/20">
                        <button 
                          type="button"
                          onClick={() => updateSetting('theme', 'midnight')}
                          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                            currentSettings.theme === 'midnight' 
                              ? 'bg-indigo-600 text-white font-bold shadow-md' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Moon className="w-4 h-4 text-indigo-300" />
                          <span className="text-[10px]">Midnight</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateSetting('theme', 'parchment')}
                          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                            currentSettings.theme === 'parchment' 
                              ? 'bg-amber-600 text-white font-bold shadow-md' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Coffee className="w-4 h-4 text-amber-300" />
                          <span className="text-[10px]">Parchment</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateSetting('theme', 'emerald')}
                          className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                            currentSettings.theme === 'emerald' 
                              ? 'bg-emerald-600 text-white font-bold shadow-md' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sun className="w-4 h-4 text-emerald-300" />
                          <span className="text-[10px]">Emerald</span>
                        </button>
                      </div>
                    </div>

                    {/* English Typography Choice */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        ENGLISH TYPOGRAPHY (طراز الخط الإنجليزي)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-[#070a12] rounded-2xl p-1.5 border border-indigo-500/20">
                        <button 
                          type="button"
                          onClick={() => updateSetting('fontFamily', 'literary')}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            (currentSettings.fontFamily === 'literary' || !currentSettings.fontFamily || currentSettings.fontFamily === 'serif')
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-literary text-xs font-semibold">Literary</span>
                          <span className="text-[9px] opacity-75 font-reading-ar">كلاسيكي روائي</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateSetting('fontFamily', 'editorial')}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            currentSettings.fontFamily === 'editorial'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-editorial-serif text-xs font-bold">Editorial</span>
                          <span className="text-[9px] opacity-75 font-reading-ar">أدبي فخم</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateSetting('fontFamily', 'sans')}
                          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            currentSettings.fontFamily === 'sans'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-modern-sans text-xs font-semibold">Modern</span>
                          <span className="text-[9px] opacity-75 font-reading-ar">عصري ناصع</span>
                        </button>
                      </div>
                    </div>

                    {/* Arabic Calligraphy Choice */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        ARABIC CALLIGRAPHY (الخط العربي المختار)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-[#091326] rounded-2xl p-1.5 border border-indigo-500/20" dir="rtl">
                        <button 
                          type="button"
                          onClick={() => updateSetting('arabicFont', 'naskh')}
                          className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            (currentSettings.arabicFont === 'naskh' || !currentSettings.arabicFont)
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-naskh-ar text-sm font-bold">خط النسخ المقروء</span>
                          <span className="text-[9px] opacity-75 font-cinematic uppercase">Noto Naskh Arabic</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => updateSetting('arabicFont', 'amiri')}
                          className={`py-2 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            currentSettings.arabicFont === 'amiri'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span className="font-amiri-ar text-base font-bold">الخط الأميري التراثي</span>
                          <span className="text-[9px] opacity-75 font-cinematic uppercase">Amiri Calligraphic</span>
                        </button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        TYPOGRAPHY SIZE (حجم الخط)
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 bg-[#091326] rounded-2xl p-1.5 border border-indigo-500/20">
                        {(['small', 'medium', 'large', 'xlarge'] as const).map(s => (
                          <button 
                            type="button"
                            key={s}
                            onClick={() => updateSetting('fontSize', s)}
                            className={`py-2 rounded-xl transition-all font-cinematic text-[11px] font-bold uppercase cursor-pointer ${
                              currentSettings.fontSize === s ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {s === 'small' ? 'SM' : s === 'medium' ? 'MD' : s === 'large' ? 'LG' : 'XL'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Line Spacing */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        LINE SPACING (تباعد الأسطر)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-[#091326] rounded-2xl p-1.5 border border-indigo-500/20">
                        {(['normal', 'relaxed', 'loose'] as const).map(s => (
                          <button 
                            type="button"
                            key={s}
                            onClick={() => updateSetting('lineSpacing', s)}
                            className={`py-2 rounded-xl transition-all font-cinematic text-[10px] font-bold uppercase cursor-pointer ${
                              currentSettings.lineSpacing === s ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Speech Playback Rate */}
                    <div>
                      <label className="text-slate-400 font-cinematic text-[10px] tracking-wider uppercase mb-2 block">
                        SPEECH SPEED (سرعة الصوت)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-[#091326] rounded-2xl p-1.5 border border-indigo-500/20">
                        {[0.75, 0.9, 1.1].map(r => (
                          <button 
                            type="button"
                            key={r}
                            onClick={() => setSpeechRate(r)}
                            className={`py-2 rounded-xl transition-all font-cinematic text-[10px] font-bold uppercase cursor-pointer ${
                              speechRate === r ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {r}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${getSubButtonClasses()}`}
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Sanctuary Document Body - The Continuous Long Paper Sheet (ورقة قراءة طويلة ككتاب) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 pb-32">
        
        {/* Subtle Top Paper Header / Watermark */}
        <div className="w-full flex items-center justify-between px-4 pb-4 text-xs font-cinematic tracking-wider opacity-60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">BILINGUAL READING SANCTUARY • MANUSCRIPT EDITION</span>
          </div>
          <div className="hidden sm:block font-reading-ar text-[11px]" dir="rtl">
            اضغط مطولاً أو نقرتين على أي كلمة للترجمة والمعجم
          </div>
        </div>

        {/* The Continuous Long Paper Sheet Container (بدون مربعات مفككة - ورقة واحدة طويلة متصلة) */}
        <motion.article 
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full rounded-2xl sm:rounded-[36px] p-4 sm:p-12 lg:p-16 transition-all duration-300 ${getPaperSheetClasses()}`}
          id="manuscript-paper-sheet"
        >
          
          {/* Paper Title / Document Header Seal */}
          <div className={`pb-8 mb-10 border-b border-dashed ${getParchmentDividerColor()} flex flex-col items-center text-center gap-3`}>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-cinematic font-bold tracking-widest uppercase">
              PARALLEL TEXT MANUSCRIPT
            </h1>
            <p className="text-xs sm:text-sm font-reading-ar max-w-md opacity-75" dir="rtl">
              ورقة القراءة المتوازية المستمرة • تصفح النصوص بسلاسة ككتاب أدبي متصل
            </p>
          </div>

          {/* Continuous Flow of Paragraphs (No Boxy Card Containers) */}
          <div className={`flex flex-col ${getLineSpacingClass()}`}>
            
            {/* Empty state if no pairs loaded */}
            {pairs.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-cinematic font-bold uppercase tracking-wider mb-2">
                  NO TEXTS CURRENTLY LOADED
                </h3>
                <p className="text-sm font-reading-ar max-w-sm opacity-70 mb-6" dir="rtl">
                  لم تقم بمزامنة نصوص بعد. يمكنك العودة إلى استوديو النصوص والمزامنة لإدخال نصوصك أو تحميل نصوص كلاسيكية جاهزة.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-cinematic font-bold text-xs uppercase tracking-wider shadow-md hover:from-amber-400 hover:to-amber-500 cursor-pointer transition-all active:scale-95"
                >
                  BACK TO SYNC STUDIO
                </button>
              </div>
            )}

            {/* VIEW MODE: Horizontal Dual (فقرات متتابعة متصلة على الورقة) */}
            {currentViewMode === 'split-horizontal' && (
              pairs.map((pair, index) => {
                const isCurrent = activeSentenceIndex === index;
                const isPlaying = playingId === pair.id;
                const isBookmarked = bookmarkedIds.has(pair.id);
                const isAnalyzing = isAnalyzingGrammar === pair.id;
                const isHovered = hoveredSentenceId === pair.id;

                return (
                  <section
                    key={pair.id}
                    ref={(el) => (sentenceRefs.current[pair.id] = el)}
                    onClick={() => setActiveSentenceIndex(index)}
                    onMouseEnter={() => setHoveredSentenceId(pair.id)}
                    onMouseLeave={() => setHoveredSentenceId(null)}
                    className={`relative group transition-all duration-200 py-4 sm:py-6 pl-4 sm:pl-8 pr-2 sm:pr-4 rounded-2xl ${
                      isCurrent 
                        ? 'bg-amber-500/[0.07] border-l-4 border-amber-400 shadow-sm' 
                        : isHovered
                        ? 'bg-white/[0.02] border-l-2 border-amber-400/40'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    {/* Subtle Side Index Marker */}
                    <div className="absolute -left-2 sm:-left-3 top-4 sm:top-6 opacity-40 font-cinematic text-[10px] font-bold text-amber-400 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Floating Discrete Passage Toolbar (Appears seamlessly on hover or active) */}
                    <div className={`flex items-center justify-between gap-3 mb-3 transition-opacity duration-150 ${
                      isCurrent || isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-40 group-hover:opacity-100'
                    }`}>
                      <span className="text-[10px] font-cinematic font-bold tracking-wider text-amber-400/90 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        PARAGRAPH {index + 1}
                      </span>

                      {/* Floating Micro Action Buttons */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Grammar Analysis */}
                        <button
                          type="button"
                          onClick={(e) => handleAnalyzeGrammar(pair, e)}
                          disabled={isAnalyzing}
                          className="px-2.5 py-1 rounded-xl bg-black/20 hover:bg-black/40 text-amber-300 border border-amber-500/30 text-[11px] font-reading-ar flex items-center gap-1 transition-all cursor-pointer"
                          title="إعراب وتحليل القواعد والأزمنة لهذه الجملة"
                        >
                          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> : <Layers className="w-3 h-3 text-amber-400" />}
                          <span className="hidden sm:inline">إعراب وقواعد</span>
                        </button>

                        {/* Audio TTS */}
                        <button
                          type="button"
                          onClick={(e) => playSentence(e, pair.id, pair.en)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isPlaying 
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse shadow-md' 
                              : 'bg-black/20 hover:bg-black/40 text-amber-400 border-amber-500/30'
                          }`}
                          title="استمع لنطق الفقرة بالكامل"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Bookmark */}
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(pair.id, e)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                              : 'bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white border-white/10'
                          }`}
                          title="إشارة مرجعية"
                        >
                          {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>

                        {/* Copy */}
                        <button
                          type="button"
                          onClick={(e) => copySentencePair(pair, e)}
                          className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                          title="نسخ النص والترجمة"
                        >
                          {copiedId === pair.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Continuous English Literary Flow */}
                    <div className={`${getFontFamilyClassEn()} ${getFontSizeClassesEn()} ${getEnglishTextColor()} tracking-normal mb-3.5`} dir="ltr">
                      {renderEnglishTokens(pair)}
                    </div>

                    {/* Harmonious Continuous Arabic Translation Flow */}
                    <div className={`${getFontFamilyClassAr()} ${getFontSizeClassesAr()} ${getArabicTextColor()} text-right pr-2 sm:pr-4 pt-1`} dir="rtl">
                      {pair.ar}
                    </div>

                    {/* Delicate Subtle Paper Pause Line Between Paragraphs */}
                    {index < pairs.length - 1 && (
                      <div className={`mt-6 pt-2 border-b border-dashed ${getParchmentDividerColor()} opacity-40`} />
                    )}
                  </section>
                );
              })
            )}

            {/* VIEW MODE: Side-by-Side Dual Columns (عمودان متوازيان كصفحة كتاب على الورقة) */}
            {currentViewMode === 'split-vertical' && (
              <div className="flex flex-col divide-y divide-dashed divide-current/15">
                {/* Column Headers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 mb-4 text-xs font-cinematic font-bold tracking-wider opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>ENGLISH ORIGINAL TEXT</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-right" dir="rtl">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-reading-ar text-sm">النص العربي المقابل</span>
                  </div>
                </div>

                {pairs.map((pair, index) => {
                  const isCurrent = activeSentenceIndex === index;
                  const isPlaying = playingId === pair.id;
                  const isAnalyzing = isAnalyzingGrammar === pair.id;

                  return (
                    <div
                      key={pair.id}
                      ref={(el) => (sentenceRefs.current[pair.id] = el)}
                      onClick={() => setActiveSentenceIndex(index)}
                      className={`grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 py-6 sm:py-8 transition-all ${
                        isCurrent ? 'bg-amber-500/[0.06] rounded-2xl px-4 sm:px-6' : 'hover:bg-white/[0.02] px-2 sm:px-4'
                      }`}
                    >
                      {/* Left Column (English) */}
                      <div className="flex flex-col justify-start">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-cinematic font-bold text-amber-400 opacity-70">
                            #{index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleAnalyzeGrammar(pair, e)}
                              disabled={isAnalyzing}
                              className="p-1 rounded text-amber-300 hover:bg-black/30 text-[10px] font-reading-ar flex items-center gap-1 cursor-pointer"
                              title="إعراب وتحليل"
                            >
                              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> : <Layers className="w-3 h-3 text-amber-400" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => playSentence(e, pair.id, pair.en)}
                              className="p-1 rounded text-amber-400 hover:bg-black/30 cursor-pointer"
                              title="استمع"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className={`${getFontFamilyClassEn()} ${getFontSizeClassesEn()} ${getEnglishTextColor()}`} dir="ltr">
                          {renderEnglishTokens(pair)}
                        </div>
                      </div>

                      {/* Right Column (Arabic) */}
                      <div className="flex flex-col justify-start md:border-r md:border-current/15 md:pr-6 md:pl-2" dir="rtl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-cinematic font-bold text-slate-400 opacity-60">
                            الترجمة المقابلة
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copySentencePair(pair, e)}
                            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                            title="نسخ"
                          >
                            {copiedId === pair.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className={`${getFontFamilyClassAr()} ${getFontSizeClassesAr()} ${getArabicTextColor()} text-right`}>
                          {pair.ar}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE: Focus English & Reveal On Demand (نص إنجليزي متصل مع كشف عند الطلب) */}
            {currentViewMode === 'english-only' && (
              pairs.map((pair, index) => {
                const isRevealed = revealedSentences[pair.id];
                const isCurrent = activeSentenceIndex === index;
                const isPlaying = playingId === pair.id;
                const isAnalyzing = isAnalyzingGrammar === pair.id;

                return (
                  <section
                    key={pair.id}
                    ref={(el) => (sentenceRefs.current[pair.id] = el)}
                    onClick={() => setActiveSentenceIndex(index)}
                    className={`relative py-4 sm:py-6 pl-4 sm:pl-8 pr-2 sm:pr-4 rounded-2xl transition-all ${
                      isCurrent ? 'bg-amber-500/[0.06] border-l-4 border-amber-400' : 'border-l-2 border-transparent hover:border-amber-400/30'
                    }`}
                  >
                    {/* Header line of the paragraph */}
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-cinematic font-bold text-amber-400/80 uppercase">
                          SECTION {index + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => toggleReveal(pair.id, e)}
                          className={`px-3 py-1 rounded-xl text-xs font-reading-ar flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isRevealed
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                              : 'bg-black/20 hover:bg-black/40 text-slate-300 border-white/10'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isRevealed ? 'إخفاء الترجمة' : 'كشف الترجمة العربية'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleAnalyzeGrammar(pair, e)}
                          disabled={isAnalyzing}
                          className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-amber-300 border border-white/10 cursor-pointer"
                          title="إعراب وتحليل"
                        >
                          {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Layers className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => playSentence(e, pair.id, pair.en)}
                          className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-amber-400 border border-white/10 cursor-pointer"
                          title="استمع"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* English Paragraph */}
                    <div className={`${getFontFamilyClassEn()} ${getFontSizeClassesEn()} ${getEnglishTextColor()} mb-3`} dir="ltr">
                      {renderEnglishTokens(pair)}
                    </div>

                    {/* Revealed Arabic Translation */}
                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className={`${getFontFamilyClassAr()} ${getFontSizeClassesAr()} ${getArabicTextColor()} text-right pt-3 pr-4 border-r-2 border-amber-400/50 my-2`} dir="rtl">
                            {pair.ar}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Paper divider */}
                    {index < pairs.length - 1 && (
                      <div className={`mt-6 pt-2 border-b border-dashed ${getParchmentDividerColor()} opacity-40`} />
                    )}
                  </section>
                );
              })
            )}

          </div>

          {/* End of Document Seal / Completed Banner */}
          <div className={`mt-16 pt-10 border-t border-dashed ${getParchmentDividerColor()} flex flex-col items-center text-center gap-4`}>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-cinematic font-bold tracking-wider uppercase">
              END OF CURRENT MANUSCRIPT
            </h3>
            <p className="text-xs font-reading-ar opacity-75 max-w-sm" dir="rtl">
              أتممت قراءة جميع فقرات هذا النص بنجاح. يمكنك تقييم المفردات أو الانتقال لإضافة نصوص جديدة.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleEvaluateFullText}
                disabled={isEvaluatingText}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-cinematic font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <Brain className="w-4 h-4" />
                <span>EVALUATE CEFR LEVEL</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/20 text-slate-200 font-cinematic font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>CLOSE & RETURN</span>
              </button>
            </div>
          </div>

        </motion.article>

      </main>

      {/* Mobile Floating Ergonomic Reading Control Bar (شريط التحكم السفلي العائم للجوال) */}
      <div className="fixed bottom-4 inset-x-3 sm:hidden z-40 flex items-center justify-between bg-[#0f172a]/95 border border-indigo-500/30 backdrop-blur-2xl rounded-2xl px-3 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 safe-bottom">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollToSentence(Math.max(0, activeSentenceIndex - 1))}
            disabled={activeSentenceIndex === 0}
            className="p-3 rounded-xl bg-[#070a12] text-slate-300 disabled:opacity-30 active:scale-95 border border-indigo-500/20 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="الفقرة السابقة"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-3 py-2 rounded-xl bg-[#070a12] border border-amber-500/25 text-center min-h-[48px] flex items-center justify-center">
            <span className="text-xs font-cinematic font-bold text-amber-400">
              {activeSentenceIndex + 1} / {pairs.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => scrollToSentence(Math.min(pairs.length - 1, activeSentenceIndex + 1))}
            disabled={activeSentenceIndex === pairs.length - 1}
            className="p-3 rounded-xl bg-[#070a12] text-slate-300 disabled:opacity-30 active:scale-95 border border-indigo-500/20 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="الفقرة التالية"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {pairs[activeSentenceIndex] && (
            <>
              <button
                type="button"
                onClick={(e) => playSentence(e, pairs[activeSentenceIndex].id, pairs[activeSentenceIndex].en)}
                className={`p-3 rounded-xl border transition-all active:scale-95 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center ${
                  playingId === pairs[activeSentenceIndex].id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md animate-pulse'
                    : 'bg-[#070a12] text-amber-400 border-indigo-500/20'
                }`}
                title="استماع للفقرة الحالية"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => handleAnalyzeGrammar(pairs[activeSentenceIndex], e)}
                disabled={isAnalyzingGrammar === pairs[activeSentenceIndex].id}
                className="p-3 rounded-xl bg-[#070a12] text-purple-300 border border-purple-500/30 active:scale-95 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                title="تحليل نحوي وإعراب"
              >
                {isAnalyzingGrammar === pairs[activeSentenceIndex].id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                ) : (
                  <Layers className="w-5 h-5 text-purple-400" />
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => readerContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 rounded-xl bg-[#070a12] text-slate-400 hover:text-white border border-indigo-500/20 active:scale-95 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="العودة لأعلى الصفحة"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Word Deep Dictionary Popup Modal */}
      {selectedWordData && (
        <WordPopup
          word={selectedWordData.word}
          contextEn={selectedWordData.contextEn}
          contextAr={selectedWordData.contextAr}
          anchorRect={selectedWordData.anchorRect}
          onClose={closePopup}
          onSave={onSaveWord}
          wordLists={wordLists}
          onSelectNewWord={(newWord) => setSelectedWordData(prev => prev ? { ...prev, word: newWord } : null)}
          onAddXP={onAddXP}
        />
      )}

      {/* Sentence Grammar Breakdown Modal */}
      {grammarAnalysis && (
        <SentenceGrammarModal
          analysis={grammarAnalysis}
          onClose={() => setGrammarAnalysis(null)}
        />
      )}

      {/* Full Text Evaluation & CEFR Report Modal */}
      {evaluationReport && (
        <TextEvaluationModal
          report={evaluationReport}
          onClose={() => setEvaluationReport(null)}
          onSaveWord={onSaveWord}
          onAddXP={onAddXP}
        />
      )}

    </motion.div>
  );
}
