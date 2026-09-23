import { Badge, UserStats } from '../types';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_step',
    title: 'الخطوة الأولى',
    titleEn: 'First Step',
    description: 'قراءة أو الاستماع إلى أول جملة تزامنية',
    icon: 'Compass',
    xpReward: 25
  },
  {
    id: 'curious_reader',
    title: 'مستكشف المعاني',
    titleEn: 'Word Explorer',
    description: 'فحص وتحليل 5 كلمات عبر القاموس الذكي',
    icon: 'Search',
    xpReward: 50
  },
  {
    id: 'word_hoarder',
    title: 'صائد المفردات',
    titleEn: 'Vocabulary Collector',
    description: 'حفظ 10 مفردات جديدة في بنك الكلمات',
    icon: 'BookmarkCheck',
    xpReward: 75
  },
  {
    id: 'golden_voice',
    title: 'نبرة ذهبية',
    titleEn: 'Golden Voice',
    description: 'إتقان تمرين نطق صوتي بنسبة دقة 80% أو أعلى',
    icon: 'Award',
    xpReward: 100
  },
  {
    id: 'sharp_memory',
    title: 'ذاكرة حديدية',
    titleEn: 'Sharp Memory',
    description: 'مراجعة 10 بطاقات استذكار في بنك المفردات',
    icon: 'Sparkles',
    xpReward: 60
  },
  {
    id: 'prompt_crafter',
    title: 'مهندس الأوامر',
    titleEn: 'Prompt Master',
    description: 'نسخ توجيه الذكاء الاصطناعي ومحاذاة نص بنجاح',
    icon: 'Zap',
    xpReward: 40
  },
  {
    id: 'daily_flame',
    title: 'شعلة الاستمرار',
    titleEn: 'Consistency Flame',
    description: 'المواظبة على التعلم والمطالعة لعدة أيام',
    icon: 'Flame',
    xpReward: 100
  }
];

export interface LevelInfo {
  level: number;
  rankTitleAr: string;
  rankTitleEn: string;
  currentLevelMinXp: number;
  nextLevelXp: number;
  progressPercent: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, titleAr: 'مبتدئ شغوف', titleEn: 'Novice Reader' },
  { level: 2, minXp: 100, titleAr: 'قارئ طموح', titleEn: 'Avid Reader' },
  { level: 3, minXp: 250, titleAr: 'باحث لغوي', titleEn: 'Linguistic Explorer' },
  { level: 4, minXp: 450, titleAr: 'متقن النصوص', titleEn: 'Text Master' },
  { level: 5, minXp: 700, titleAr: 'خبير اللغات', titleEn: 'Language Sage' },
  { level: 6, minXp: 1050, titleAr: 'أديب متألق', titleEn: 'Literary Virtuoso' },
  { level: 7, minXp: 1500, titleAr: 'أسطورة لغوية', titleEn: 'Polyglot Legend' },
];

export function getLevelInfo(xp: number): LevelInfo {
  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || {
        level: currentTier.level + 1,
        minXp: currentTier.minXp + 500,
        titleAr: 'أسطورة لغوية عليا',
        titleEn: 'Grand Master'
      };
      break;
    }
  }

  const range = nextTier.minXp - currentTier.minXp;
  const progressInLevel = Math.max(0, xp - currentTier.minXp);
  const progressPercent = Math.min(100, Math.round((progressInLevel / range) * 100));

  return {
    level: currentTier.level,
    rankTitleAr: currentTier.titleAr,
    rankTitleEn: currentTier.titleEn,
    currentLevelMinXp: currentTier.minXp,
    nextLevelXp: nextTier.minXp,
    progressPercent
  };
}

export function evaluateBadges(stats: UserStats): Badge[] {
  const newBadges: Badge[] = [];
  const currentIds = new Set(stats.unlockedBadgeIds || []);

  if (!currentIds.has('first_step') && stats.sentencesRead >= 1) {
    const b = ALL_BADGES.find(x => x.id === 'first_step');
    if (b) newBadges.push(b);
  }

  if (!currentIds.has('curious_reader') && stats.wordsLookedUp >= 5) {
    const b = ALL_BADGES.find(x => x.id === 'curious_reader');
    if (b) newBadges.push(b);
  }

  if (!currentIds.has('word_hoarder') && stats.wordsSaved >= 10) {
    const b = ALL_BADGES.find(x => x.id === 'word_hoarder');
    if (b) newBadges.push(b);
  }

  if (!currentIds.has('golden_voice') && stats.pronunciationsPracticed >= 1) {
    const b = ALL_BADGES.find(x => x.id === 'golden_voice');
    if (b) newBadges.push(b);
  }

  if (!currentIds.has('sharp_memory') && stats.flashcardsReviewed >= 10) {
    const b = ALL_BADGES.find(x => x.id === 'sharp_memory');
    if (b) newBadges.push(b);
  }

  if (!currentIds.has('daily_flame') && stats.streakDays >= 2) {
    const b = ALL_BADGES.find(x => x.id === 'daily_flame');
    if (b) newBadges.push(b);
  }

  return newBadges;
}
