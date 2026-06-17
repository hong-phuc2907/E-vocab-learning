import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function userDoc(uid: string) {
  return doc(db, "users", uid);
}

export async function updateStreak(uid: string): Promise<number> {
  const ref = userDoc(uid);
  const snap = await getDoc(ref);
  const today = todayKey();
  const yesterday = yesterdayKey();

  if (!snap.exists()) {
    await setDoc(ref, { currentStreak: 1, lastStudiedDate: today });
    return 1;
  }

  const data = snap.data();
  const last: string | undefined = data.lastStudiedDate;

  if (last === today) {
    return data.currentStreak ?? 1;
  }

  const newStreak = last === yesterday ? (data.currentStreak ?? 0) + 1 : 1;
  await updateDoc(ref, { currentStreak: newStreak, lastStudiedDate: today });
  return newStreak;
}

export interface Word {
  id: string;
  term: string;
  definition: string;

  synonyms?: string[];

  partOfSpeech?: string;
  example?: string;
  pronunciation?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";

  masteryLevel: number;
  reviewCount: number;
  correctCount: number;

  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;

  createdAt: string;
}

export interface WordInput {
  term: string;
  definition: string;

  synonyms?: string[];

  partOfSpeech?: string;
  example?: string;
  pronunciation?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
}

function wordsCol(uid: string) {
  return collection(db, "users", uid, "words");
}

function toWord(id: string, data: Record<string, any>): Word {
  return {
  id,
  term: data.term,
  definition: data.definition,

  synonyms: data.synonyms ?? [],
    partOfSpeech: data.partOfSpeech ?? undefined,
    example: data.example ?? undefined,
    pronunciation: data.pronunciation ?? undefined,
    category: data.category ?? undefined,
    difficulty: data.difficulty ?? undefined,
    masteryLevel: data.masteryLevel ?? 0,
    reviewCount: data.reviewCount ?? 0,
    correctCount: data.correctCount ?? 0,
    lastReviewedAt: data.lastReviewedAt instanceof Timestamp
      ? data.lastReviewedAt.toDate().toISOString()
      : data.lastReviewedAt ?? null,
    nextReviewAt: data.nextReviewAt instanceof Timestamp
      ? data.nextReviewAt.toDate().toISOString()
      : data.nextReviewAt ?? null,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function checkMultiAnswer(
  input: string,
  answers: string[]
): boolean {
  const userAnswers = input
    .split(",")
    .map((s) => normalizeAnswer(s))
    .filter(Boolean)
    .sort();

  const correctAnswers = answers
    .map((s) => normalizeAnswer(s))
    .sort();

  if (
    userAnswers.length !== correctAnswers.length
  ) {
    return false;
  }

  return correctAnswers.every(
    (v, i) => v === userAnswers[i]
  );
}

export async function findDuplicate(
export async function findDuplicate(
  uid: string,
  input: WordInput
): Promise<Word | null> {
  const snap = await getDocs(wordsCol(uid));

  const normalize = (s: string) =>
    s.trim().toLowerCase();

  for (const d of snap.docs) {
    const w = toWord(d.id, d.data());

    if (
      normalize(w.term) === normalize(input.term)
    ) {
      return w;
    }
  }

  return null;
}

export async function getWord(uid: string, wordId: string): Promise<Word | null> {
  const ref = doc(db, "users", uid, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toWord(snap.id, snap.data());
}

export async function getDueWords(uid: string): Promise<Word[]> {
  const now = new Date();
  const snap = await getDocs(wordsCol(uid));
  return snap.docs
    .map((d) => toWord(d.id, d.data()))
    .filter((w) => {
      if (!w.nextReviewAt) return true;
      return new Date(w.nextReviewAt) <= now;
    })
    .sort((a, b) => a.masteryLevel - b.masteryLevel);
}

export async function getDailyWord(uid: string): Promise<Word | null> {
  const snap = await getDocs(wordsCol(uid));
  if (snap.empty) return null;
  const words = snap.docs.map((d) => toWord(d.id, d.data()));
  const dayIndex = Math.floor(Date.now() / 86400000);
  return words[dayIndex % words.length];
}



export async function createWord(uid: string, input: WordInput): Promise<Word> {
  const ref = await addDoc(wordsCol(uid), {
    ...input,
    masteryLevel: 0,
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    createdAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toWord(snap.id, snap.data()!);
}

export async function deleteWord(uid: string, wordId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "words", wordId));
}

export async function reviewWord(uid: string, wordId: string, correct: boolean): Promise<Word> {
  const ref = doc(db, "users", uid, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Word not found");
  const data = snap.data();
  const newReviewCount = (data.reviewCount ?? 0) + 1;
  const newCorrectCount = correct ? (data.correctCount ?? 0) + 1 : (data.correctCount ?? 0);
  const cur = data.masteryLevel ?? 0;
  const newMastery = correct ? Math.min(5, cur + 1) : Math.max(0, cur - 1);
  const nextReview = computeNextReview(newMastery);
  await updateDoc(ref, {
    reviewCount: newReviewCount,
    correctCount: newCorrectCount,
    masteryLevel: newMastery,
    lastReviewedAt: new Date(),
    nextReviewAt: nextReview,
  });
  const updated = await getDoc(ref);
  return toWord(updated.id, updated.data()!);
}

export interface Stats {
  totalWords: number;
  masteredWords: number;
  dueForReview: number;
  accuracy: number;
  currentStreak: number;
}

export async function getStats(uid: string): Promise<Stats> {
  const now = new Date();
  const [wordsSnap, metaSnap] = await Promise.all([
    getDocs(wordsCol(uid)),
    getDoc(userDoc(uid)),
  ]);
  const words = wordsSnap.docs.map((d) => toWord(d.id, d.data()));
  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.masteryLevel >= 5).length;
  const dueForReview = words.filter((w) => !w.nextReviewAt || new Date(w.nextReviewAt) <= now).length;
  const totalReviews = words.reduce((s, w) => s + w.reviewCount, 0);
  const totalCorrect = words.reduce((s, w) => s + w.correctCount, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  const meta = metaSnap.exists() ? metaSnap.data() : null;
  const lastStudied = meta?.lastStudiedDate;
  const today = todayKey();
  const yesterday = yesterdayKey();
  const streakAlive = lastStudied === today || lastStudied === yesterday;
  const currentStreak = streakAlive ? (meta?.currentStreak ?? 0) : 0;
  return { totalWords, masteredWords, dueForReview, accuracy, currentStreak };
}
