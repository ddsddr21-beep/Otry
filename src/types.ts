export type ViewMode = 'split-horizontal' | 'english-only' | 'split-vertical';

export type ReaderTheme = 'midnight' | 'parchment' | 'emerald' | 'obsidian' | 'dark' | 'sepia' | 'light';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type LineSpacing = 'normal' | 'relaxed' | 'loose';

export interface TextEvaluationReport {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  cefrTitleAr: string;
  readabilityScore: number;
  readabilityLevelAr: string;
  readingTimeMinutes: number;
  totalWords: number;
  uniqueWords: number;
  translationQualityScore: number;
  translationQualityNotesAr: string;
  keyIdioms: { phrase: string; meaningAr: string; exampleEn?: string }[];
  challengingVocabulary: { word: string; cefr: string; meaningAr: string }[];
  grammarHighlights: { structure: string; explanationAr: string }[];
  learnerRecommendationsAr: string[];
  literaryToneAr?: string;
  avgSentenceLength?: number;
  lexicalDiversityPercent?: number;
}

export interface SentenceGrammarAnalysis {
  sentenceEn: string;
  tensesUsed: string[];
  breakdown: { segment: string; role: string; explanationAr: string }[];
  keyVocabulary: { word: string; pos: string; meaningAr: string }[];
  simplifiedVersionEn?: string;
  summaryAr?: string;
}

export type ReadingFontFamily = 'literary' | 'editorial' | 'sans' | 'serif' | 'mono';
export type ArabicReadingFont = 'naskh' | 'amiri';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: FontSize;
  lineSpacing: LineSpacing;
  focusMode?: boolean;
  highlightAdvancedWords?: boolean;
  fontFamily?: ReadingFontFamily;
  arabicFont?: ArabicReadingFont;
}

export interface SentencePair {
  id: string;
  en: string;
  ar: string;
  isBookmarked?: boolean;
}

export interface WordList {
  id: string;
  name: string;
}

export interface ExpandedMeaning {
  partOfSpeech: string;
  partOfSpeechAr?: string;
  definitionEn: string;
  definitionAr: string;
  exampleEn?: string;
  exampleAr?: string;
  synonyms?: string[];
}

export interface ComprehensiveDictionaryData {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meaning_ar: string;
  definition_en?: string;
  definition_ar?: string;
  part_of_speech?: string;
  part_of_speech_ar?: string;
  example_en?: string;
  example_ar?: string;
  expanded_meanings?: ExpandedMeaning[];
  synonyms?: string[];
  antonyms?: string[];
  collocations?: { phrase: string; meaningAr: string }[];
  origin_ar?: string;
  source?: string;
}

export interface SavedWord {
  id: string;
  word: string;
  contextEn: string;
  contextAr: string;
  meaningAr: string;
  partOfSpeech?: string;
  timestamp: number;
  listId?: string;
  mastered?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  sentencesRead: number;
  wordsLookedUp: number;
  wordsSaved: number;
  pronunciationsPracticed: number;
  flashcardsReviewed: number;
  unlockedBadgeIds: string[];
}

export interface XpToast {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}
