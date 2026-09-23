import React from 'react';
import { 
  X, 
  Trophy, 
  Flame, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  Calendar,
  Volume2,
  Compass,
  Search,
  BookmarkCheck,
  Crown
} from 'lucide-react';
import { UserStats, Badge } from '../types';
import { ALL_BADGES, getLevelInfo } from '../lib/gamification';

interface Props {
  stats: UserStats;
  onClose: () => void;
}

const renderBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case 'Compass': return <Compass className="w-4 h-4 text-amber-400" />;
    case 'Search': return <Search className="w-4 h-4 text-amber-400" />;
    case 'BookmarkCheck': return <BookmarkCheck className="w-4 h-4 text-amber-400" />;
    case 'Award': return <Award className="w-4 h-4 text-amber-400" />;
    case 'Sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
    case 'Zap': return <Zap className="w-4 h-4 text-amber-400" />;
    case 'Flame': return <Flame className="w-4 h-4 text-amber-400" />;
    default: return <Trophy className="w-4 h-4 text-amber-400" />;
  }
};

export default function GamificationModal({ stats, onClose }: Props) {
  const levelInfo = getLevelInfo(stats.xp);
  const unlockedIds = new Set(stats.unlockedBadgeIds || []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-[#0e1c38] rounded-t-[32px] sm:rounded-3xl border border-indigo-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] text-[#f1f5f9] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Handle Indicator */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header Banner */}
        <div className="p-5 sm:p-6 border-b border-indigo-500/20 flex items-center justify-between bg-[#091326]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-cinematic uppercase tracking-wider">
                Progress & Achievements
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-reading-ar" dir="rtl">
                مستوى القراءة ونقاط الخبرة التراكمية والأوسمة الأدبية المحققة
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Level Progress Hero Card */}
          <div className="p-6 rounded-3xl bg-[#091326]/90 border border-indigo-500/25 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-cinematic font-extrabold flex items-center justify-center text-base shadow-lg shadow-amber-500/30">
                  {levelInfo.level}
                </span>
                <div>
                  <div className="font-cinematic text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {levelInfo.rankTitleEn} (مستوى {levelInfo.level})
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {stats.xp} TOTAL XP
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-cinematic font-bold">
                <Flame className="w-4 h-4 fill-current text-amber-400" />
                <span>{stats.streakDays} DAY STREAK</span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-cinematic text-slate-400">
                <span>PROGRESS TO LEVEL {levelInfo.level + 1}</span>
                <span className="text-amber-400 font-bold">{levelInfo.progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-[#060c18] rounded-full overflow-hidden border border-indigo-500/20">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Metrics 4-Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#091326]/80 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-cinematic uppercase tracking-wider">Read Paragraphs</span>
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-cinematic font-bold text-white">
                {stats.sentencesRead}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091326]/80 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-cinematic uppercase tracking-wider">Saved Words</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-cinematic font-bold text-white">
                {stats.wordsSaved}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091326]/80 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-cinematic uppercase tracking-wider">Lookups</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-cinematic font-bold text-white">
                {stats.wordsLookedUp}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091326]/80 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-cinematic uppercase tracking-wider">Pronunciations</span>
                <Volume2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-cinematic font-bold text-white">
                {stats.pronunciationsPracticed}
              </div>
            </div>
          </div>

          {/* Badges Collection */}
          <div className="space-y-3">
            <h4 className="text-xs font-cinematic uppercase tracking-wider text-slate-400 font-bold">
              Badges Collection ({stats.unlockedBadgeIds?.length || 0} / {ALL_BADGES.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_BADGES.map(badge => {
                const isUnlocked = unlockedIds.has(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-[#091326] border-amber-500/40 shadow-sm'
                        : 'bg-[#091326]/40 border-indigo-500/10 opacity-40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnlocked ? 'bg-amber-500/20 border border-amber-400/40 text-amber-400' : 'bg-white/5 text-slate-500'
                    }`}>
                      {renderBadgeIcon(badge.icon)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-reading-ar" dir="rtl">
                        {badge.title} ({badge.xpReward} XP)
                      </div>
                      <div className="text-[11px] text-slate-400 font-reading-ar line-clamp-1" dir="rtl">
                        {badge.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#091326] border-t border-indigo-500/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinematic font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-amber-500/25"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

