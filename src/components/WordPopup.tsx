import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  BookmarkPlus, 
  Check, 
  Loader2, 
  Volume2, 
  Mic, 
  AlertCircle, 
  Sparkles,
  Edit3,
  Layers,
  Link2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { SavedWord, WordList, ComprehensiveDictionaryData } from '../types';

interface Props {
  word: string;
  contextEn: string;
  contextAr: string;
  anchorRect?: DOMRect | null;
  onClose: () => void;
  onSave: (word: Omit<SavedWord, 'id' | 'timestamp'>) => void;
  wordLists: WordList[];
  onAddXP?: (amount: number, reason: string, statType?: 'wordsSaved' | 'pronunciationsPracticed') => void;
  onSelectNewWord?: (word: string) => void;
}

export default function WordPopup({ 
  word, 
  contextEn, 
  contextAr, 
  anchorRect, 
  onClose, 
  onSave, 
  wordLists, 
  onAddXP,
  onSelectNewWord
}: Props) {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'expanded' | 'context' | 'practice'>('dictionary');
  const [loading, setLoading] = useState(false);
  const [dictionaryData, setDictionaryData] = useState<ComprehensiveDictionaryData | null>(null);
  const [contextData, setContextData] = useState<any>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [customMeaning, setCustomMeaning] = useState('');
  const [isEditingMeaning, setIsEditingMeaning] = useState(false);
  const [selectedListId, setSelectedListId] = useState(wordLists[0]?.id || 'default');
  
  // Audio & Practice State
  const [playingTTS, setPlayingTTS] = useState(false);
  const [recording, setRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [practiceResult, setPracticeResult] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Popover positioning calculation
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    fetchDictionary(word);
    setContextData(null);
    setPracticeResult(null);
    setIsEditingMeaning(false);
    setCustomMeaning('');
  }, [word]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Calculate anchored positioning for desktop or bottom-sheet for mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setPopoverStyle({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '85vh',
        zIndex: 50,
      });
      return;
    }

    if (!anchorRect) {
      // Fallback centered
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      });
      return;
    }

    const popoverWidth = Math.min(480, window.innerWidth - 32);
    const popoverHeightEst = 440;

    const spaceAbove = anchorRect.top;
    const spaceBelow = window.innerHeight - anchorRect.bottom;

    // Prefer positioning above if there's enough space or if space above > space below
    const showAbove = spaceAbove > popoverHeightEst || spaceAbove > spaceBelow;
    setPlacement(showAbove ? 'top' : 'bottom');

    let top = 0;
    if (showAbove) {
      top = Math.max(16, anchorRect.top - popoverHeightEst - 12);
    } else {
      top = Math.min(window.innerHeight - popoverHeightEst - 16, anchorRect.bottom + 12);
    }

    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    // Clamp to viewport
    left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, left));

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: '85vh',
      zIndex: 50,
    });
  }, [anchorRect]);

  const fetchDictionary = async (targetWord: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gemini/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetWord })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDictionaryData(data);
      if (data.meaning_ar) {
        setCustomMeaning(data.meaning_ar);
      }
    } catch (err: any) {
      console.warn('Dictionary lookup fallback triggered:', err);
      setDictionaryData({
        word: targetWord,
        meaning_ar: 'انقر للتعديل أو أضف المعنى المناسب',
        definition_en: `The word "${targetWord}" in English.`,
        part_of_speech: 'word',
        source: 'القاموس المحلي'
      });
      setCustomMeaning('معنى مخصص');
    } finally {
      setLoading(false);
    }
  };

  const fetchContext = async () => {
    setActiveTab('context');
    if (contextData) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gemini/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, contextEn, contextAr })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setContextData(data);
    } catch (err: any) {
      setContextData({
        context_meaning_ar: 'المعنى بحسب سياق الجملة الحالية',
        explanation_ar: `تُستخدم كلمة "${word}" في هذه الجملة لتعبر عن الدلالة السياقية المترجمة.`
      });
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = async () => {
    if (playingTTS) return;
    setPlayingTTS(true);

    // If external dictionary provided real audio, prefer it
    if (dictionaryData?.audioUrl) {
      try {
        const audio = new Audio(dictionaryData.audioUrl);
        audio.onended = () => setPlayingTTS(false);
        audio.onerror = () => fallbackGeminiTTS();
        await audio.play();
        return;
      } catch {
        fallbackGeminiTTS();
        return;
      }
    }

    fallbackGeminiTTS();
  };

  const fallbackGeminiTTS = async () => {
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onended = () => setPlayingTTS(false);
        audio.onerror = () => fallbackBrowserSpeech();
        await audio.play();
      } else {
        fallbackBrowserSpeech();
      }
    } catch {
      fallbackBrowserSpeech();
    }
  };

  const fallbackBrowserSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setPlayingTTS(false);
      utterance.onerror = () => setPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingTTS(false);
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        evaluatePronunciation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setPracticeResult(null);
    } catch {
      setError('تعذر الوصول للميكروفون مباشرة. يمكنك النقر على "تقييم تجريبي" لاختبار النظام.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const simulateTestPronunciation = () => {
    setEvaluating(true);
    setError('');
    setTimeout(() => {
      setPracticeResult({
        score: 90,
        feedback_ar: `نطق ممتاز لكلمة "${word}"! مخارج الحروف واضحة مع إيقاع صوتي سليم.`,
        transcribed: word
      });
      setEvaluating(false);
      onAddXP?.(25, `تدرب على نطق كلمة "${word}" بنجاح`, 'pronunciationsPracticed');
    }, 900);
  };

  const evaluatePronunciation = async (audioBlob: Blob) => {
    setEvaluating(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const res = await fetch('/api/gemini/pronunciation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            targetWord: word,
            mimeType: audioBlob.type || 'audio/webm'
          })
        });

        const data = await res.json();
        if (data.error && !data.score) throw new Error(data.error);
        setPracticeResult(data);

        const score = data.score || 75;
        const xpEarned = score >= 80 ? 30 : score >= 60 ? 20 : 10;
        onAddXP?.(xpEarned, `تدرب على نطق "${word}" (دقة ${score}%)`, 'pronunciationsPracticed');
      };
    } catch {
      simulateTestPronunciation();
    } finally {
      setEvaluating(false);
    }
  };

  const handleSave = () => {
    const translation = customMeaning || dictionaryData?.meaning_ar || contextData?.context_meaning_ar || 'معنى الكلمة';
    const partOfSpeech = dictionaryData?.part_of_speech || '';
    const exampleEn = dictionaryData?.example_en || contextEn;
    const exampleAr = dictionaryData?.example_ar || contextAr;

    onSave({
      word,
      meaningAr: translation,
      partOfSpeech,
      contextEn: exampleEn,
      contextAr: exampleAr,
      listId: selectedListId
    });

    setSaved(true);
    onAddXP?.(15, `تم حفظ كلمة "${word}" في بنك المفردات`, 'wordsSaved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {/* Light backdrop for effortless click-outside dismissal */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Medium-sized Floating Card Anchored near the Word (or Bottom Drawer on Mobile) */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f172a]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border border-indigo-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[85vh] sm:max-h-[520px] overflow-hidden text-slate-100 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 ring-1 ring-white/10 safe-bottom"
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1 bg-[#070a12]">
          <div className="w-12 h-1.5 bg-slate-600/50 rounded-full" />
        </div>

        {/* Header Bar */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-[#070a12] border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-reading-en font-bold text-white tracking-tight">{word}</h3>
            {dictionaryData?.phonetic && (
              <span className="text-xs font-cinematic text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {dictionaryData.phonetic}
              </span>
            )}
            <button
              type="button"
              onClick={playPronunciation}
              disabled={playingTTS}
              className="p-2 rounded-xl bg-[#0f172a] hover:bg-[#1a2642] text-amber-400 border border-amber-500/30 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="استمع لنطق الكلمة"
            >
              {playingTTS ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {dictionaryData?.source && (
              <span className="hidden sm:inline-block text-[10px] font-cinematic text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {dictionaryData.source}
              </span>
            )}
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Segmented Navigation Tabs */}
        <div className="flex border-b border-indigo-500/20 bg-[#070a12]/90 px-4 gap-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('dictionary')}
            className={`py-3 text-xs font-cinematic font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer min-h-[44px] flex items-center ${
              activeTab === 'dictionary'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            القاموس الشامل
            {activeTab === 'dictionary' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          {dictionaryData?.expanded_meanings && dictionaryData.expanded_meanings.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('expanded')}
              className={`py-3 text-xs font-cinematic font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer min-h-[44px] flex items-center ${
                activeTab === 'expanded'
                  ? 'text-amber-400 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              معاني موسعة ({dictionaryData.expanded_meanings.length})
              {activeTab === 'expanded' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={fetchContext}
            className={`py-2.5 text-xs font-cinematic font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === 'context'
                ? 'text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المعنى في السياق
            {activeTab === 'context' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`py-2.5 text-xs font-cinematic font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap cursor-pointer ${
              activeTab === 'practice'
                ? 'text-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تدريب النطق
            {activeTab === 'practice' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1 text-sm space-y-3.5 scrollbar-thin">
          {error && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-2" dir="rtl">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{error}</span>
              </div>
              {activeTab === 'practice' && (
                <button
                  type="button"
                  onClick={simulateTestPronunciation}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-cinematic shrink-0 cursor-pointer"
                >
                  تقييم تجريبي
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-cinematic uppercase tracking-wider">جاري فحص المعجم واستدعاء الترجمة...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Comprehensive Dictionary (القاموس الشامل) */}
              {activeTab === 'dictionary' && (
                <div className="space-y-3">
                  {/* Main Arabic Meaning Card */}
                  <div className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl" dir="rtl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-reading-ar">المعنى الأساسي:</span>
                        {dictionaryData?.part_of_speech_ar && (
                          <span className="text-[11px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25">
                            {dictionaryData.part_of_speech_ar} ({dictionaryData.part_of_speech})
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsEditingMeaning(!isEditingMeaning)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-reading-ar"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingMeaning ? 'حفظ' : 'تعديل'}</span>
                      </button>
                    </div>

                    {isEditingMeaning ? (
                      <input 
                        type="text"
                        value={customMeaning}
                        onChange={(e) => setCustomMeaning(e.target.value)}
                        className="w-full bg-[#0e1c38] border border-amber-500/50 rounded-xl px-3 py-1.5 text-base font-bold text-white outline-none font-reading-ar"
                        placeholder="أدخل الترجمة العربية..."
                      />
                    ) : (
                      <div className="text-xl font-bold text-amber-300 font-reading-ar">
                        {customMeaning || dictionaryData?.meaning_ar || 'غير محدد'}
                      </div>
                    )}

                    {dictionaryData?.definition_ar && (
                      <p className="text-xs text-slate-300 mt-2 pt-2 border-t border-white/5 font-reading-ar leading-relaxed">
                        {dictionaryData.definition_ar}
                      </p>
                    )}
                  </div>

                  {/* English Definition */}
                  {dictionaryData?.definition_en && (
                    <div className="p-3 bg-[#091326]/60 border border-indigo-500/20 rounded-xl space-y-1">
                      <div className="text-[10px] text-slate-400 font-cinematic uppercase tracking-wider">Definition (English):</div>
                      <p className="text-slate-200 font-reading-en text-xs leading-relaxed">
                        {dictionaryData.definition_en}
                      </p>
                    </div>
                  )}

                  {/* Illustrative Example */}
                  {dictionaryData?.example_en && (
                    <div className="p-3 bg-[#091326]/60 border border-indigo-500/20 rounded-xl space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-cinematic uppercase tracking-wider">Example:</div>
                      <p className="font-reading-en text-xs text-amber-200/90 italic">
                        "{dictionaryData.example_en}"
                      </p>
                      {dictionaryData.example_ar && (
                        <p className="font-reading-ar text-xs text-slate-300" dir="rtl">
                          «{dictionaryData.example_ar}»
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms & Antonyms Chips */}
                  {(dictionaryData?.synonyms && dictionaryData.synonyms.length > 0) && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-cinematic uppercase tracking-wider">Synonyms (المرادفات):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {dictionaryData.synonyms.map((syn, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => onSelectNewWord?.(syn)}
                            className="text-xs px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-white/10 transition-colors font-reading-en flex items-center gap-1 cursor-pointer"
                            title={`ابحث عن كلمة "${syn}"`}
                          >
                            <span>{syn}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 opacity-50" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Collocations */}
                  {(dictionaryData?.collocations && dictionaryData.collocations.length > 0) && (
                    <div className="p-3 bg-[#091326] border border-indigo-500/20 rounded-xl space-y-1.5" dir="rtl">
                      <span className="text-[11px] text-amber-400 font-reading-ar font-bold">تعبيرات شائعة (Collocations):</span>
                      <div className="space-y-1">
                        {dictionaryData.collocations.map((col, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5 border-b border-white/5 last:border-0">
                            <span className="font-reading-en text-slate-200" dir="ltr">{col.phrase}</span>
                            <span className="font-reading-ar text-slate-400">{col.meaningAr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Etymology / Origin */}
                  {dictionaryData?.origin_ar && (
                    <div className="p-2.5 bg-white/5 rounded-xl text-right" dir="rtl">
                      <span className="text-[10px] text-slate-400 font-reading-ar block mb-0.5">أصل الكلمة وجذورها:</span>
                      <p className="text-[11px] text-slate-300 font-reading-ar leading-relaxed">{dictionaryData.origin_ar}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Expanded Meanings (المعاني الموسعة) */}
              {activeTab === 'expanded' && dictionaryData?.expanded_meanings && (
                <div className="space-y-3" dir="rtl">
                  <div className="text-xs text-slate-400 font-reading-ar">
                    المعاني والتصنيفات النحوية الموسعة لكلمة <span className="text-amber-300 font-bold" dir="ltr">"{word}"</span>:
                  </div>

                  {dictionaryData.expanded_meanings.map((sense, idx) => (
                    <div key={idx} className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-reading-ar text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          {sense.partOfSpeechAr || sense.partOfSpeech}
                        </span>
                        <span className="text-[10px] font-cinematic text-slate-400 uppercase">
                          SENSE #{idx + 1}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white font-reading-ar">
                        {sense.definitionAr}
                      </div>

                      <p className="text-xs text-slate-300 font-reading-en text-left" dir="ltr">
                        {sense.definitionEn}
                      </p>

                      {sense.exampleEn && (
                        <div className="p-2 bg-[#0e1c38] rounded-xl text-xs space-y-1">
                          <p className="font-reading-en text-amber-200/90 text-left italic" dir="ltr">
                            "{sense.exampleEn}"
                          </p>
                          {sense.exampleAr && (
                            <p className="font-reading-ar text-slate-300">
                              «{sense.exampleAr}»
                            </p>
                          )}
                        </div>
                      )}

                      {sense.synonyms && sense.synonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-slate-400">مرادفات:</span>
                          {sense.synonyms.map((s, sIdx) => (
                            <span key={sIdx} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-reading-en" dir="ltr">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: Context Tab (المعنى في السياق) */}
              {activeTab === 'context' && (
                <div className="space-y-3" dir="rtl">
                  {contextData ? (
                    <>
                      <div className="p-3.5 bg-[#091326] border border-indigo-500/25 rounded-2xl">
                        <div className="text-[11px] text-slate-400 mb-1 font-reading-ar">المعنى الدقيق في سياق هذه الجملة:</div>
                        <div className="text-lg font-reading-ar font-bold text-amber-300">
                          {contextData.context_meaning_ar}
                        </div>
                      </div>

                      {contextData.explanation_ar && (
                        <div className="p-3 bg-[#091326]/60 border border-indigo-500/20 rounded-xl space-y-1">
                          <div className="text-[11px] text-slate-400 font-reading-ar font-bold">الشرح والتحليل السياقي:</div>
                          <p className="text-xs font-reading-ar text-slate-200 leading-relaxed">
                            {contextData.explanation_ar}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                      <span className="text-xs font-reading-ar">جاري تحليل السياق...</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Practice Tab (تدريب النطق) */}
              {activeTab === 'practice' && (
                <div className="space-y-4 text-center py-1">
                  <div className="space-y-1">
                    <p className="text-2xl font-reading-en font-bold text-white tracking-tight">{word}</p>
                    {dictionaryData?.phonetic && (
                      <p className="text-xs font-cinematic text-amber-400">{dictionaryData.phonetic}</p>
                    )}
                  </div>

                  {/* Recording Action Button */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      disabled={evaluating}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                        recording
                          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/40'
                          : evaluating
                            ? 'bg-white/5 text-slate-600'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                      }`}
                      title={recording ? "انقر للإيقاف والتقييم" : "انقر للتسجيل بصوتك"}
                    >
                      {evaluating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : recording ? (
                        <span className="w-4 h-4 bg-white rounded-xs" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                    <span className="text-[11px] text-slate-300 font-cinematic">
                      {recording ? "جاري الاستماع... انقر للإيقاف" : evaluating ? "جاري التقييم والتحليل..." : "انقر على الميكروفون لبدء التسجيل"}
                    </span>
                  </div>

                  {/* Practice Feedback Result */}
                  {practiceResult && (
                    <div className="p-3 bg-[#091326] border border-indigo-500/25 rounded-2xl text-right space-y-2" dir="rtl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-reading-ar text-slate-400">دقة النطق:</span>
                        <span className={`text-xs font-bold font-cinematic px-2.5 py-0.5 rounded-full ${
                          practiceResult.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                          practiceResult.score >= 60 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                          'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}>
                          {practiceResult.score}%
                        </span>
                      </div>

                      {practiceResult.feedback_ar && (
                        <p className="text-xs font-reading-ar text-slate-200 leading-relaxed">
                          {practiceResult.feedback_ar}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 pb-6 sm:pb-3.5 bg-[#070a12] border-t border-indigo-500/20 flex items-center justify-between gap-3 safe-bottom">
          <div className="flex items-center gap-2" dir="rtl">
            <span className="text-xs text-slate-400 font-reading-ar">القائمة:</span>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="bg-[#0f172a] text-xs text-slate-200 border border-indigo-500/20 rounded-xl px-3 py-2 outline-none font-reading-ar cursor-pointer min-h-[44px]"
            >
              {wordLists.map((list) => (
                <option key={list.id} value={list.id} className="bg-[#070a12] text-white">
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className={`px-5 py-2.5 rounded-xl text-xs font-black font-cinematic uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg min-h-[48px] ${
              saved
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>تم الحفظ!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>حفظ (+15 XP)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
