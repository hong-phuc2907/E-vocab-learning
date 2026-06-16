import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Word {
  id: string;
  term: string;
  definition: string;
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

function computeNextReview(masteryLevel: number): Date {
  const intervals = [0, 1, 3, 7, 14, 30];
  const days = intervals[Math.min(masteryLevel, 5)];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function listWords(uid: string, opts?: { search?: string; difficulty?: string }): Promise<Word[]> {
  const q = query(wordsCol(uid), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  let words = snap.docs.map((d) => toWord(d.id, d.data()));

  if (opts?.search) {
    const s = opts.search.toLowerCase();
    words = words.filter(
      (w) => w.term.toLowerCase().includes(s) || w.definition.toLowerCase().includes(s)
    );
  }
  if (opts?.difficulty) {
    words = words.filter((w) => w.difficulty === opts.difficulty);
  }
  return words;
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
  const snap = await getDocs(wordsCol(uid));
  const words = snap.docs.map((d) => toWord(d.id, d.data()));
  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.masteryLevel >= 5).length;
  const dueForReview = words.filter((w) => !w.nextReviewAt || new Date(w.nextReviewAt) <= now).length;
  const totalReviews = words.reduce((s, w) => s + w.reviewCount, 0);
  const totalCorrect = words.reduce((s, w) => s + w.correctCount, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  return { totalWords, masteredWords, dueForReview, accuracy, currentStreak: 0 };
}
