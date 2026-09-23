import React, { useState } from 'react';
import { 
  BookOpen, 
  Trash2, 
  Plus, 
  Search, 
  Volume2, 
  Loader2, 
  RotateCw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles,
  BookmarkCheck,
  Check,
  Download,
  Crown,
  Award
} from 'lucide-react';
import { SavedWord, WordList } from '../types';

interface Props {
  words: SavedWord[];
  onRemove: (id: string) => void;
  lists: WordList[];
  onUpdateLists: (lists: WordList[]) => void;
  onUpdateWord: (id: string, updates: Partial<SavedWord>) => void;
  onAddXP?: (amount: number, reason: string, statType?: 'flashcardsReviewed') => void;
  onImportWords?: (newWords: SavedWord[]) => void;
}

export default function VocabularyList({ 
  words, 
  onRemove, 
  lists, 
  onUpdateLists, 
  onUpdateWord, 
  onAddXP
}: Props) {
  const [activeListId, setActiveListId] = useState<string>('all');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [search, setSearch] = useState('');
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  
  // Flashcards Review Mode State
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [filterMastered, setFilterMastered] = useState<'all' | 'unmastered' | 'mastered'>('all');

  const activeWords = words.filter(w => {
    const matchesList = activeListId === 'all' ? true : (w.listId || 'default') === activeListId;
    const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) || w.meaningAr.includes(search);
    const matchesMastery = 
      filterMastered === 'all' ? true :
      filterMastered === 'mastered' ? !!w.mastered : !w.mastered;
    return matchesList && matchesSearch && matchesMastery;
  });

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: WordList = { id: crypto.randomUUID(), name: newListName.trim() };
    onUpdateLists([...lists, newList]);
    setNewListName('');
    setIsCreatingList(false);
    setActiveListId(newList.id);
    onAddXP?.(10, `إنشاء قائمة مفردات جديدة: "${newList.name}"`);
  };

  const handleDeleteList = (listId: string) => {
    if (listId === 'default') return;
    if (window.confirm('هل أنت متأكد من حذف هذه القائمة؟ ستنتقل الكلمات تلقائياً إلى القائمة العامة.')) {
      onUpdateLists(lists.filter(l => l.id !== listId));
      if (activeListId === listId) setActiveListId('all');
      words.filter(w => w.listId === listId).forEach(w => {
        onUpdateWord(w.id, { listId: 'default' });
      });
    }
  };

  const playWordAudio = async (e: React.MouseEvent | undefined, word: string, id: string) => {
    e?.stopPropagation();
    if (playingWordId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingWordId(null);
      return;
    }

    setPlayingWordId(id);

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onended = () => setPlayingWordId(null);
        audio.onerror = () => fallbackSpeech(word);
        await audio.play();
      } else {
        fallbackSpeech(word);
      }
    } catch {
      fallbackSpeech(word);
    }
  };

  const fallbackSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setPlayingWordId(null);
      utterance.onerror = () => setPlayingWordId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingWordId(null);
    }
  };

  const exportVocabularyJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `linguasync-vocabulary-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFlashcardMastered = (word: SavedWord, mastered: boolean) => {
    onUpdateWord(word.id, { mastered });
    onAddXP?.(mastered ? 20 : 10, mastered ? `إتقان كلمة "${word.word}"!` : `مراجعة كلمة "${word.word}"`, 'flashcardsReviewed');
    
    if (reviewIndex < activeWords.length - 1) {
      setIsCardFlipped(false);
      setReviewIndex(prev => prev + 1);
    } else {
      setIsCardFlipped(false);
      setReviewIndex(0);
    }
  };

  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-20 px-6 text-center text-slate-300">
        <div className="w-20 h-20 rounded-3xl bg-[#0f172a] border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-2xl shadow-amber-500/10">
          <BookmarkCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-cinematic font-bold uppercase tracking-wider text-white mb-2">
          NO SAVED VOCABULARY YET
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed font-reading-ar" dir="rtl">
          أثناء قراءة أي نص في القارئ المتوازي، انقر على أي كلمة بالإنجليزية لفتح القاموس، معرفة معناها في السياق، والاستماع لنطقها ثم حفظها هنا في بنك المفردات.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6" id="vocabulary-container">
      
      {/* Top Header Controls Card */}
      <div className="bg-[#0f172a]/80 p-6 rounded-3xl border border-indigo-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-cinematic uppercase tracking-wider">
              VOCABULARY BANK & FLASHCARDS
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-cinematic font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {words.length} WORDS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-reading-ar" dir="rtl">
            راجع مفرداتك المحفوظة، استمع لنطقها الفوري، وتدرب عبر بطاقات المراجعة التفاعلية الذكية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Flashcard Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsReviewMode(!isReviewMode);
              setReviewIndex(0);
              setIsCardFlipped(false);
            }}
            disabled={activeWords.length === 0}
            className={`px-5 py-3 rounded-2xl text-xs font-cinematic font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 shadow-md min-h-[48px] ${
              isReviewMode
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                : 'bg-[#070a12] hover:bg-[#121c33] text-amber-300 border border-amber-500/30'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isReviewMode ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>{isReviewMode ? 'LIST VIEW' : 'STUDY FLASHCARDS'}</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={exportVocabularyJSON}
            className="p-3 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-slate-300 hover:text-white border border-indigo-500/20 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="تصدير المفردات إلى ملف JSON"
          >
            <Download className="w-4 h-4 text-amber-400" />
          </button>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60" dir="ltr">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vocabulary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#070a12] border border-indigo-500/20 focus:border-indigo-400 rounded-2xl pl-9 pr-3 py-3 text-xs focus:outline-none text-slate-100 placeholder:text-slate-500 font-cinematic min-h-[48px]"
            />
          </div>
        </div>
      </div>

      {/* List Filters & Folders Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/80 border border-indigo-500/20 rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {/* Categories / Lists Tabs */}
        <div className="flex flex-wrap items-center gap-2" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveListId('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-reading-ar transition-all cursor-pointer min-h-[44px] ${
              activeListId === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white bg-[#070a12] border border-indigo-500/20'
            }`}
          >
            جميع الكلمات ({words.length})
          </button>

          {lists.map((list) => {
            const count = words.filter(w => (w.listId || 'default') === list.id).length;
            const isSelected = activeListId === list.id;

            return (
              <div key={list.id} className="flex items-center gap-1 bg-[#070a12] border border-indigo-500/20 rounded-xl pl-1">
                <button
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-reading-ar transition-all cursor-pointer min-h-[44px] ${
                    isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {list.name} ({count})
                </button>
                {list.id !== 'default' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="حذف القائمة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {isCreatingList ? (
            <div className="flex items-center gap-1.5 bg-[#070a12] p-1.5 rounded-xl border border-amber-500/30">
              <input
                type="text"
                placeholder="اسم القائمة..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-transparent px-2 py-1 text-xs text-white outline-none w-28 font-reading-ar min-h-[40px]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateList}
                className="p-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingList(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#070a12] hover:bg-[#121c33] border border-indigo-500/20 text-xs text-amber-300 font-reading-ar flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>قائمة جديدة</span>
            </button>
          )}
        </div>

        {/* Mastery Filter */}
        <div className="flex items-center gap-1 bg-[#070a12] p-1 rounded-2xl border border-indigo-500/20 text-xs font-cinematic font-bold">
          <button
            type="button"
            onClick={() => setFilterMastered('all')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
              filterMastered === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => setFilterMastered('unmastered')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
              filterMastered === 'unmastered' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            TO PRACTICE
          </button>
          <button
            type="button"
            onClick={() => setFilterMastered('mastered')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
              filterMastered === 'mastered' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            MASTERED
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLASHCARDS INTERACTIVE REVIEW MODE                                       */}
      {/* ========================================================================= */}
      {isReviewMode ? (
        activeWords.length > 0 ? (
          <div className="flex flex-col items-center gap-6 max-w-xl mx-auto w-full py-4">
            <div className="w-full flex items-center justify-between text-xs font-cinematic text-slate-400">
              <span>CARD {reviewIndex + 1} OF {activeWords.length}</span>
              <span className="text-amber-400 font-bold">{Math.round(((reviewIndex + 1) / activeWords.length) * 100)}% COMPLETED</span>
            </div>

            {/* Flip Card Container */}
            {(() => {
              const currentWord = activeWords[reviewIndex];
              if (!currentWord) return null;

              return (
                <div 
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="w-full h-84 bg-[#0f172a] rounded-3xl border border-indigo-500/25 p-8 flex flex-col justify-between items-center text-center cursor-pointer select-none shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative transition-all duration-300 hover:border-amber-400/50 backdrop-blur-xl ring-1 ring-white/10"
                >
                  {/* Top Word Card Badges */}
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-cinematic text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                      {currentWord.partOfSpeech || 'VOCABULARY'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => playWordAudio(e, currentWord.word, currentWord.id)}
                      className="p-3 rounded-2xl bg-[#070a12] hover:bg-[#121c33] text-amber-400 border border-indigo-500/20 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Card Center Content */}
                  <div className="space-y-4">
                    {!isCardFlipped ? (
                      <div className="space-y-2">
                        <h3 className="text-4xl sm:text-5xl font-reading-en font-bold text-white tracking-tight">
                          {currentWord.word}
                        </h3>
                        <p className="text-xs text-slate-400 font-cinematic">
                          (انقر للكشف عن الترجمة والمعنى السياقي)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150" dir="rtl">
                        <h3 className="text-3xl sm:text-4xl font-reading-ar font-bold text-amber-300">
                          {currentWord.meaningAr}
                        </h3>
                        {currentWord.contextEn && (
                          <div className="p-3 bg-[#070a12] rounded-2xl border border-indigo-500/20 text-xs text-slate-300 font-reading-en italic text-left" dir="ltr">
                            "{currentWord.contextEn}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Hint */}
                  <div className="text-xs font-cinematic text-slate-400 flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>CLICK CARD TO FLIP</span>
                  </div>
                </div>
              );
            })()}

            {/* Flashcard Response Buttons */}
            {activeWords[reviewIndex] && (
              <div className="w-full grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => handleFlashcardMastered(activeWords[reviewIndex], false)}
                  className="py-4 px-4 rounded-2xl bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border border-amber-500/40 text-xs font-cinematic font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[48px]"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>NEEDS PRACTICE (+10 XP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFlashcardMastered(activeWords[reviewIndex], true)}
                  className="py-4 px-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-xs font-cinematic font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[48px]"
                >
                  <Check className="w-4 h-4" />
                  <span>MASTERED (+20 XP)</span>
                </button>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsCardFlipped(false);
                  setReviewIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={reviewIndex === 0}
                className="p-3 rounded-2xl bg-[#0f172a] hover:bg-[#121c33] text-white disabled:opacity-30 border border-indigo-500/20 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCardFlipped(false);
                  setReviewIndex(prev => Math.min(activeWords.length - 1, prev + 1));
                }}
                disabled={reviewIndex === activeWords.length - 1}
                className="p-3 rounded-2xl bg-[#0f172a] hover:bg-[#121c33] text-white disabled:opacity-30 border border-indigo-500/20 cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 font-cinematic">
            NO WORDS MATCHING CURRENT FILTER
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* STANDARD VOCABULARY LIST GRID VIEW                                       */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeWords.map((item) => (
            <div
              key={item.id}
              className="bg-[#0f172a]/80 border border-indigo-500/20 hover:border-amber-400/40 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all shadow-[0_10px_35px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            >
              <div>
                {/* Word Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-2xl font-reading-en font-bold text-white tracking-tight">
                      {item.word}
                    </h3>
                    {item.partOfSpeech && (
                      <span className="text-[11px] font-cinematic text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        {item.partOfSpeech}
                      </span>
                    )}
                    {item.mastered && (
                      <span className="text-[11px] font-cinematic text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>MASTERED</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => playWordAudio(e, item.word, item.id)}
                      className="p-2.5 rounded-xl bg-[#070a12] hover:bg-[#121c33] text-amber-400 border border-indigo-500/20 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="استمع لنطق الكلمة"
                    >
                      {playingWordId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="p-2.5 rounded-xl bg-[#070a12] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-indigo-500/20 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="حذف الكلمة من المفردات"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arabic Translation */}
                <div className="text-lg font-reading-ar font-bold text-amber-300 text-right mb-3" dir="rtl">
                  {item.meaningAr}
                </div>

                {/* Example Context */}
                {item.contextEn && (
                  <div className="p-3.5 bg-[#070a12] rounded-2xl border border-indigo-500/20 space-y-1">
                    <div className="text-[10px] text-slate-400 font-cinematic uppercase tracking-wider">Context Example:</div>
                    <p className="text-xs sm:text-sm text-slate-200 font-reading-en italic leading-relaxed">
                      "{item.contextEn}"
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Meta & Move to List Selector */}
              <div className="flex items-center justify-between pt-3 border-t border-indigo-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-cinematic">List:</span>
                  <select
                    value={item.listId || 'default'}
                    onChange={(e) => onUpdateWord(item.id, { listId: e.target.value })}
                    className="bg-[#070a12] text-xs text-slate-200 border border-indigo-500/20 rounded-xl px-2.5 py-1.5 outline-none font-reading-ar cursor-pointer min-h-[40px]"
                  >
                    {lists.map((l) => (
                      <option key={l.id} value={l.id} className="bg-[#0f172a] text-white">
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateWord(item.id, { mastered: !item.mastered })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-cinematic font-bold transition-all cursor-pointer min-h-[40px] ${
                    item.mastered
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#070a12] text-slate-400 hover:text-white border border-indigo-500/20'
                  }`}
                >
                  {item.mastered ? 'MARK TO PRACTICE' : 'MARK AS MASTERED'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

