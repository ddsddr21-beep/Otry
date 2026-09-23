import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode, SentencePair, SavedWord, ReaderSettings, WordList, UserStats, XpToast } from './types';
import { 
  Settings, 
  BookOpen, 
  BookmarkCheck, 
  X, 
  Sun, 
  Moon, 
  Coffee, 
  Zap, 
  Flame,
  Sparkles,
  Edit3,
  Crown
} from 'lucide-react';
import TextSetup from './components/TextSetup';
import Reader from './components/Reader';
import VocabularyList from './components/VocabularyList';
import GamificationModal from './components/GamificationModal';
import XpToastContainer from './components/XpToastContainer';
import { getLevelInfo, evaluateBadges } from './lib/gamification';

const INITIAL_PAIRS: SentencePair[] = [
  {
    id: 'sample-1',
    en: 'It is only with the heart that one can see rightly.',
    ar: 'لا يرى المرء الرؤية الصادقة إلا بقلبه.'
  },
  {
    id: 'sample-2',
    en: 'What is essential is invisible to the eye.',
    ar: 'فالأشياء الجوهرية محجوبة عن أعيننا.'
  },
  {
    id: 'sample-3',
    en: 'It is the time you have wasted for your rose that makes your rose so important.',
    ar: 'إن الوقت الذي أضعته في سبيل وردتك هو ما جعلها في غاية الأهمية.'
  },
  {
    id: 'sample-4',
    en: 'You become responsible forever for what you have tamed.',
    ar: 'أنت مسؤول إلى الأبد عن كل ما قمت بترويضه.'
  },
  {
    id: 'sample-5',
    en: 'The most beautiful things in the world cannot be seen or touched, they are felt with the heart.',
    ar: 'إن أجمل الأشياء في هذا الوجود لا تُرى ولا تُلمس، بل يُشعر بها بالقلب.'
  }
];

const DEFAULT_USER_STATS: UserStats = {
  xp: 40,
  level: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  sentencesRead: 0,
  wordsLookedUp: 0,
  wordsSaved: 0,
  pronunciationsPracticed: 0,
  flashcardsReviewed: 0,
  unlockedBadgeIds: []
};

export default function App() {
  const [pairs, setPairs] = useState<SentencePair[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split-horizontal');
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [wordLists, setWordLists] = useState<WordList[]>([{ id: 'default', name: 'المفردات العامة' }]);
  const [activeTab, setActiveTab] = useState<'editor' | 'vocab'>('editor');
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [xpToasts, setXpToasts] = useState<XpToast[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_USER_STATS);

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    theme: 'midnight',
    fontSize: 'medium',
    lineSpacing: 'relaxed'
  });

  useEffect(() => {
    const storedPairs = localStorage.getItem('bilingual-pairs');
    const storedWords = localStorage.getItem('bilingual-words');
    const storedLists = localStorage.getItem('bilingual-lists');
    const storedSettings = localStorage.getItem('bilingual-settings');
    const storedStats = localStorage.getItem('bilingual-user-stats');
    
    if (storedPairs) {
      try {
        const parsed = JSON.parse(storedPairs);
        setPairs(parsed.length > 0 ? parsed : INITIAL_PAIRS);
      } catch {
        setPairs(INITIAL_PAIRS);
      }
    } else {
      setPairs(INITIAL_PAIRS);
    }

    if (storedWords) {
      try { setSavedWords(JSON.parse(storedWords)); } catch {}
    }
    if (storedLists) {
      try { setWordLists(JSON.parse(storedLists)); } catch {}
    }
    if (storedSettings) {
      try { 
        const parsed = JSON.parse(storedSettings);
        if (parsed.theme === 'dark') parsed.theme = 'midnight';
        if (parsed.theme === 'sepia' || parsed.theme === 'light') parsed.theme = 'parchment';
        setReaderSettings(parsed);
      } catch {}
    }

    const today = new Date().toISOString().split('T')[0];
    let currentStats = DEFAULT_USER_STATS;
    if (storedStats) {
      try {
        const parsed = JSON.parse(storedStats);
        currentStats = { ...DEFAULT_USER_STATS, ...parsed };
        
        if (parsed.lastActiveDate) {
          const lastDate = new Date(parsed.lastActiveDate);
          const currentDate = new Date(today);
          const diffTime = currentDate.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
          
          if (diffDays === 1) {
            currentStats.streakDays = (currentStats.streakDays || 1) + 1;
            currentStats.lastActiveDate = today;
          } else if (diffDays > 1) {
            currentStats.streakDays = 1;
            currentStats.lastActiveDate = today;
          }
        } else {
          currentStats.lastActiveDate = today;
        }
      } catch (e) {
        console.error('Error loading stats', e);
      }
    }
    setUserStats(currentStats);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGamificationModal) setShowGamificationModal(false);
        if (showSettings) setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGamificationModal, showSettings]);

  useEffect(() => {
    if (pairs.length > 0) localStorage.setItem('bilingual-pairs', JSON.stringify(pairs));
  }, [pairs]);

  useEffect(() => {
    localStorage.setItem('bilingual-words', JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem('bilingual-lists', JSON.stringify(wordLists));
  }, [wordLists]);

  useEffect(() => {
    localStorage.setItem('bilingual-settings', JSON.stringify(readerSettings));
  }, [readerSettings]);

  useEffect(() => {
    localStorage.setItem('bilingual-user-stats', JSON.stringify(userStats));
  }, [userStats]);

  const addXP = (
    amount: number, 
    reason: string, 
    statType?: 'sentencesRead' | 'wordsLookedUp' | 'wordsSaved' | 'pronunciationsPracticed' | 'flashcardsReviewed'
  ) => {
    setUserStats((prev) => {
      const newXp = prev.xp + amount;
      const updatedStats: UserStats = {
        ...prev,
        xp: newXp,
        sentencesRead: statType === 'sentencesRead' ? prev.sentencesRead + 1 : prev.sentencesRead,
        wordsLookedUp: statType === 'wordsLookedUp' ? prev.wordsLookedUp + 1 : prev.wordsLookedUp,
        wordsSaved: statType === 'wordsSaved' ? prev.wordsSaved + 1 : prev.wordsSaved,
        pronunciationsPracticed: statType === 'pronunciationsPracticed' ? prev.pronunciationsPracticed + 1 : prev.pronunciationsPracticed,
        flashcardsReviewed: statType === 'flashcardsReviewed' ? prev.flashcardsReviewed + 1 : prev.flashcardsReviewed,
      };

      const newLevelInfo = getLevelInfo(newXp);
      updatedStats.level = newLevelInfo.level;

      const newBadges = evaluateBadges(updatedStats);
      if (newBadges.length > 0) {
        const newlyEarnedIds = newBadges.map(b => b.id);
        const totalBadgeBonusXp = newBadges.reduce((sum, b) => sum + b.xpReward, 0);
        updatedStats.unlockedBadgeIds = [...(prev.unlockedBadgeIds || []), ...newlyEarnedIds];
        updatedStats.xp += totalBadgeBonusXp;

        const badgeToast: XpToast = {
          id: crypto.randomUUID(),
          amount: totalBadgeBonusXp,
          reason: `وسام جديد: ${newBadges.map(b => b.title).join('، ')}`,
          timestamp: Date.now()
        };
        setXpToasts(curr => [...curr, badgeToast]);
        setTimeout(() => {
          setXpToasts(curr => curr.filter(t => t.id !== badgeToast.id));
        }, 4500);
      }

      return updatedStats;
    });

    const toast: XpToast = {
      id: crypto.randomUUID(),
      amount,
      reason,
      timestamp: Date.now()
    };
    setXpToasts(curr => [...curr, toast]);
    setTimeout(() => {
      setXpToasts(curr => curr.filter(t => t.id !== toast.id));
    }, 3200);
  };

  const currentLevelInfo = getLevelInfo(userStats.xp);

  const handleAlignTexts = (newPairs: SentencePair[]) => {
    setPairs(newPairs);
    setIsReaderOpen(true);
  };

  const saveWord = (wordData: Omit<SavedWord, 'id' | 'timestamp'>) => {
    const newWord: SavedWord = {
      ...wordData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      listId: wordData.listId || 'default'
    };
    setSavedWords((prev) => [newWord, ...prev.filter(w => w.word.toLowerCase() !== newWord.word.toLowerCase() || w.contextEn !== newWord.contextEn)]);
  };

  const removeWord = (id: string) => {
    setSavedWords((prev) => prev.filter(w => w.id !== id));
  };

  const getThemeWrapperClass = () => {
    switch (readerSettings.theme) {
      case 'parchment':
        return 'bg-[#fefaf0] text-[#1e293b] theme-parchment';
      case 'emerald':
        return 'bg-[#021712] text-[#ecfdf5] theme-emerald';
      case 'midnight':
      default:
        return 'bg-[#070a12] text-[#f8fafc] theme-midnight';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeWrapperClass()} font-sans flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300 pb-safe-nav md:pb-0`}>
      
      {/* هيدر سينمائي حديث ومتجاوب */}
      <header className="h-16 sm:h-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-indigo-500/20 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* الهوية والشعار */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-[#070a12] rounded-[14px] flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl font-cinematic font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                LINGUASYNC
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-reading-ar font-bold border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                القارئ السينمائي
              </span>
            </div>
          </div>
        </div>
        
        {/* شريط التنقل للأجهزة المكتبية */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#070a12]/70 p-1.5 rounded-2xl border border-indigo-500/20 shadow-inner">
          <button 
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-xs font-cinematic font-bold tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'editor' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>STUDIO</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`px-4 py-2 text-xs font-cinematic font-bold tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vocab' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 font-extrabold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>VOCAB BANK ({savedWords.length})</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsReaderOpen(true)}
            className="px-4 py-2 text-xs font-cinematic font-bold tracking-wider rounded-xl transition-all flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 font-black ml-2"
          >
            <BookOpen className="w-4 h-4 fill-current" />
            <span>MANUSCRIPT ({pairs.length})</span>
          </button>
        </nav>

        {/* أزرار الإنجاز والإعدادات */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setShowGamificationModal(true)}
            className="flex items-center gap-2 bg-[#070a12]/80 hover:bg-[#121c33] border border-amber-500/30 hover:border-amber-400 px-3 py-2 rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-95 min-h-[48px]"
          >
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
              <Zap className="w-4 h-4 fill-current animate-pulse text-amber-400" />
              <span>{userStats.xp} <span className="hidden xs:inline">XP</span></span>
            </div>
            <div className="h-3 w-px bg-indigo-500/30" />
            <div className="flex items-center gap-1 text-slate-200 text-xs font-cinematic font-bold">
              <span>L{currentLevelInfo.level}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{userStats.streakDays}d</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center ${
              showSettings 
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30' 
                : 'bg-[#070a12]/80 border-indigo-500/20 text-slate-300 hover:text-white hover:border-indigo-500/40'
            }`}
            title="الإعدادات والمظهر"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* نافذة الإعدادات المنبثقة الذكية للجوال والمكتبي */}
      <AnimatePresence>
        {showSettings && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-md bg-[#0f172a] rounded-t-[32px] sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-indigo-500/30 p-6 space-y-6 text-xs text-[#f8fafc] max-h-[90vh] overflow-y-auto safe-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-600/50 mx-auto -mt-1 sm:hidden" />

              <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="font-cinematic font-bold text-white tracking-wider text-sm">CINEMATIC DISPLAY & THEME</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowSettings(false)} 
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* اختيار السمة */}
              <div>
                <label className="text-slate-400 font-cinematic text-[11px] tracking-wider uppercase mb-2.5 block">
                  COLOR ATMOSPHERE (سمة الألوان والأجواء)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#070a12] rounded-2xl p-2 border border-indigo-500/20">
                  <button 
                    type="button"
                    onClick={() => setReaderSettings(s => ({ ...s, theme: 'midnight' }))}
                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                      readerSettings.theme === 'midnight' 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/30' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-300" />
                    <span className="text-[11px]">Midnight</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReaderSettings(s => ({ ...s, theme: 'parchment' }))}
                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                      readerSettings.theme === 'parchment' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-lg shadow-amber-600/30' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-amber-300" />
                    <span className="text-[11px]">Parchment</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setReaderSettings(s => ({ ...s, theme: 'emerald' }))}
                    className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all font-cinematic cursor-pointer min-h-[48px] ${
                      readerSettings.theme === 'emerald' 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/30' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px]">Emerald</span>
                  </button>
                </div>
              </div>

              {/* حجم خط القراءة */}
              <div>
                <label className="text-slate-400 font-cinematic text-[11px] tracking-wider uppercase mb-2.5 block">
                  READING SIZE (حجم الخط بالقارئ)
                </label>
                <div className="grid grid-cols-4 gap-2 bg-[#070a12] rounded-2xl p-2 border border-indigo-500/20">
                  {(['small', 'medium', 'large', 'xlarge'] as const).map(s => (
                    <button 
                      type="button"
                      key={s}
                      onClick={() => setReaderSettings(prev => ({ ...prev, fontSize: s }))}
                      className={`py-2.5 rounded-xl transition-all font-cinematic text-xs font-bold uppercase cursor-pointer min-h-[48px] flex items-center justify-center ${
                        readerSettings.fontSize === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s === 'small' ? 'صغير' : s === 'medium' ? 'متوسط' : s === 'large' ? 'كبير' : 'ضخم'}
                    </button>
                  ))}
                </div>
              </div>

              {/* تباعد الأسطر */}
              <div>
                <label className="text-slate-400 font-cinematic text-[11px] tracking-wider uppercase mb-2.5 block">
                  LINE SPACING (تباعد الأسطر)
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#070a12] rounded-2xl p-2 border border-indigo-500/20">
                  {(['normal', 'relaxed', 'loose'] as const).map(s => (
                    <button 
                      type="button"
                      key={s}
                      onClick={() => setReaderSettings(prev => ({ ...prev, lineSpacing: s }))}
                      className={`py-2.5 rounded-xl transition-all font-cinematic text-xs font-bold uppercase cursor-pointer min-h-[48px] flex items-center justify-center ${
                        readerSettings.lineSpacing === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s === 'normal' ? 'عادي' : s === 'relaxed' ? 'مريح' : 'واسع'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-reading-ar text-sm transition-all cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 min-h-[48px] flex items-center justify-center"
              >
                تطبيق الإعدادات
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 w-full mx-auto flex flex-col p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
            >
              <TextSetup 
                onAlign={handleAlignTexts} 
                onAddXP={addXP}
                onSaveWord={saveWord}
                currentPairsCount={pairs.length}
                onOpenReader={() => setIsReaderOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'vocab' && (
            <motion.div 
              key="vocab"
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
            >
              <VocabularyList 
                words={savedWords} 
                onRemove={removeWord} 
                lists={wordLists} 
                onUpdateLists={setWordLists}
                onUpdateWord={(id, updates) => setSavedWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))}
                onAddXP={addXP}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* شاشة القراءة الملحمية الكاملة */}
      <AnimatePresence>
        {isReaderOpen && (
          <Reader 
            pairs={pairs} 
            viewMode={viewMode} 
            settings={readerSettings} 
            onSaveWord={saveWord} 
            wordLists={wordLists} 
            onAddXP={addXP}
            onClose={() => setIsReaderOpen(false)}
            onUpdateSettings={setReaderSettings}
            onUpdateViewMode={setViewMode}
          />
        )}
      </AnimatePresence>

      {/* شريط التنقل السفلي العائم للجوال (Floating Dock) */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40" aria-label="شريط التنقل السفلي العائم للجوال">
        <nav className="max-w-md mx-auto bg-[#0f172a]/90 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 flex items-center justify-between gap-1 safe-bottom">
          
          {/* تبويب المزامنة / الاستوديو */}
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer min-h-[48px] active:scale-95 ${
              activeTab === 'editor'
                ? 'text-white font-bold bg-indigo-600/30 border border-indigo-500/40 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-reading-ar font-bold leading-tight">المزامنة</span>
          </button>

          {/* تبويب المعجم وبنك المفردات */}
          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative cursor-pointer min-h-[48px] active:scale-95 ${
              activeTab === 'vocab'
                ? 'text-white font-bold bg-indigo-600/30 border border-indigo-500/40 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <BookmarkCheck className="w-5 h-5 mb-0.5" />
              {savedWords.length > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-amber-500 text-slate-950 rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-black flex items-center justify-center shadow-md">
                  {savedWords.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-reading-ar font-bold leading-tight">المعجم</span>
          </button>

          {/* الزر الرئيسي الأوسط العائم: فتح المخطوطة للقراءة */}
          <button
            type="button"
            onClick={() => setIsReaderOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95 transition-all min-h-[50px] border border-amber-300/40"
            title="فتح المخطوطة للقراءة"
          >
            <BookOpen className="w-5 h-5 fill-current mb-0.5" />
            <span className="text-[10px] font-cinematic font-black tracking-wider leading-tight">MANUSCRIPT</span>
          </button>

          {/* تبويب الإنجازات والأوسمة */}
          <button
            type="button"
            onClick={() => setShowGamificationModal(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-slate-400 hover:text-amber-300 transition-all cursor-pointer min-h-[48px] active:scale-95"
          >
            <Crown className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[11px] font-reading-ar font-bold leading-tight">إنجازاتي</span>
          </button>
        </nav>
      </div>

      {/* نافذة الإنجازات التفاعلية */}
      {showGamificationModal && (
        <GamificationModal 
          stats={userStats} 
          onClose={() => setShowGamificationModal(false)} 
        />
      )}

      {/* إشعارات نقاط الخبرة التفاعلية */}
      <XpToastContainer toasts={xpToasts} />

    </div>
  );
}
