import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  getDocs, getDoc, setDoc, query, where, 
  serverTimestamp, Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// SỬA LỖI MÚI GIỜ: Tự bóc tách chuỗi số, loại bỏ 100% hiện tượng đảo ngày/tháng (7/6 và 6/7)
function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey(): string {
  return formatDateYYYYMMDD(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateYYYYMMDD(d);
}

function userDoc(uid: string) { 
  return doc(db, "users", uid); 
}

function wordsCol(uid: string) { 
  return collection(db, "users", uid, "words"); 
}

function groupsCol(uid: string) { 
  return collection(db, "users", uid, "groups"); 
}

export interface Group { id: string; name: string; parentId: string | null; path?: string[]; childrenCount?: number; wordCount?: number; description?: string; color?: string; icon?: string; createdAt: string; updatedAt?: string; }
export interface GroupNode extends Group { subGroups: GroupNode[]; words: Word[]; }
export interface Word { id: string; term: string; definition: string; synonyms?: string[]; groupIds?: string[]; partOfSpeech?: string; example?: string; pronunciation?: string; category?: string; difficulty?: "easy" | "medium" | "hard"; masteryLevel: number; reviewCount: number; correctCount: number; lastReviewedAt?: string | null; nextReviewAt?: string | null; createdAt: string; termLower?: string; }
export interface WordInput { term: string; definition: string; synonyms?: string[]; groupIds?: string[]; partOfSpeech?: string; example?: string; pronunciation?: string; category?: string; difficulty?: "easy" | "medium" | "hard"; }
export interface Stats { totalWords: number; masteredWords: number; dueForReview: number; accuracy: number; currentStreak: number; }

function toWord(id: string, data: Record<string, any>): Word {
  return {
    id, 
    term: data.term ?? "", 
    termLower: data.termLower ?? data.term?.trim().toLowerCase() ?? "",
    definition: data.definition ?? "", 
    synonyms: data.synonyms ?? [], 
    groupIds: data.groupIds ?? [],
    partOfSpeech: data.partOfSpeech, 
    example: data.example, 
    pronunciation: data.pronunciation, 
    category: data.category, 
    difficulty: data.difficulty,
    masteryLevel: data.masteryLevel ?? 0, 
    reviewCount: data.reviewCount ?? 0, 
    correctCount: data.correctCount ?? 0,
    lastReviewedAt: data.lastReviewedAt instanceof Timestamp ? data.lastReviewedAt.toDate().toISOString() : data.lastReviewedAt ?? null,
    nextReviewAt: data.nextReviewAt instanceof Timestamp ? data.nextReviewAt.toDate().toISOString() : data.nextReviewAt ?? null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt ?? new Date().toISOString(),
  };
}

function toGroup(id: string, data: Record<string, any>): Group {
  return {
    id,
    name: data.name ?? "",
    parentId: data.parentId ?? null,
    path: data.path ?? [],
    childrenCount: data.childrenCount ?? 0,
    wordCount: data.wordCount ?? 0,
    description: data.description,
    color: data.color,
    icon: data.icon,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt ?? new Date().toISOString(),
  };
}

export function normalizeAnswer(text: string): string { 
  return text.toLowerCase().trim().replace(/\s+/g, " "); 
}

export function checkMultiAnswer(input: string, answers: string[]): boolean {
  const userAnswers = input.split(",").map((s) => normalizeAnswer(s)).filter(Boolean).sort();
  const correctAnswers = answers.map((s) => normalizeAnswer(s)).sort();
  if (userAnswers.length !== correctAnswers.length) return false;
  return correctAnswers.every((v, i) => v === userAnswers[i]);
}

function computeNextReview(masteryLevel: number): Date {
  const intervals = [0, 1, 3, 7, 14, 30]; 
  const days = intervals[Math.min(masteryLevel, 5)];
  const d = new Date(); 
  d.setDate(d.getDate() + days); 
  return d;
}

/* ================= WORD FUNCTIONS ================= */

export async function createWord(uid: string, input: WordInput): Promise<Word> {
  const now = new Date().toISOString();
  const normalizedTermLower = input.term.trim().toLowerCase();

  const ref = await addDoc(wordsCol(uid), { 
    ...input, 
    termLower: normalizedTermLower,
    synonyms: input.synonyms ?? [], 
    groupIds: input.groupIds ?? [], 
    masteryLevel: 0, 
    reviewCount: 0, 
    correctCount: 0, 
    lastReviewedAt: null, 
    nextReviewAt: null, 
    createdAt: serverTimestamp() 
  });

  return {
    id: ref.id,
    term: input.term,
    termLower: normalizedTermLower,
    definition: input.definition,
    synonyms: input.synonyms ?? [],
    groupIds: input.groupIds ?? [],
    partOfSpeech: input.partOfSpeech,
    example: input.example,
    pronunciation: input.pronunciation,
    category: input.category,
    difficulty: input.difficulty,
    masteryLevel: 0,
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    createdAt: now,
  };
}

export async function getWord(uid: string, wordId: string): Promise<Word | null> {
  const ref = doc(db, "users", uid, "words", wordId); 
  const snap = await getDoc(ref);
  if (!snap.exists()) return null; 
  return toWord(snap.id, snap.data());
}

export async function updateWord(userId: string, wordId: string, updates: Partial<Word>) {
  const ref = doc(db, "users", userId, "words", wordId);
  const finalUpdates: any = { ...updates };
  if (updates.term) {
    finalUpdates.termLower = updates.term.trim().toLowerCase();
  }
  await updateDoc(ref, finalUpdates);
}

export async function deleteWord(uid: string, wordId: string): Promise<void> { 
  await deleteDoc(doc(db, "users", uid, "words", wordId)); 
}

export async function findDuplicate(uid: string, input: WordInput): Promise<Word | null> {
  const search = input.term.trim().toLowerCase();
  const q = query(wordsCol(uid), where("termLower", "==", search));
  const snap = await getDocs(q);

  if (!snap.empty) {
    return toWord(snap.docs[0].id, snap.docs[0].data());
  }

  const snapAll = await getDocs(wordsCol(uid));
  for (const d of snapAll.docs) {
    const data = d.data();
    if ((data.term ?? "").trim().toLowerCase() === search) {
      return toWord(d.id, data);
    }
  }

  return null;
}

export async function listWords(uid: string, opts?: { search?: string; difficulty?: string; groupId?: string; createdFilter?: "today" | "yesterday" | "3days" | "7days" | "30days"; }): Promise<Word[]> {
  let constraints: any[] = [];
  
  if (opts?.difficulty) {
    constraints.push(where("difficulty", "==", opts.difficulty));
  }
  if (opts?.groupId) {
    constraints.push(where("groupIds", "array-contains", opts.groupId));
  }

  const q = query(wordsCol(uid), ...constraints); 
  const snap = await getDocs(q); 
  
  let words = snap.docs
    .map((d) => toWord(d.id, d.data()))
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    words = words.filter((w) => 
      w.term.toLowerCase().includes(s) || 
      w.definition.toLowerCase().includes(s) || 
      (w.synonyms ?? []).some((syn) => syn.toLowerCase().includes(s))
    );
  }
  
  if (opts?.createdFilter) {
    const now = new Date(); 
    words = words.filter((w) => {
      if (!w.createdAt) return false;
      const created = new Date(w.createdAt); 
      const diff = Math.floor((now.getTime() - created.getTime()) / 86400000);
      if (opts.createdFilter === "today") return diff === 0;
      if (opts.createdFilter === "yesterday") return diff === 1;
      if (opts.createdFilter === "3days") return diff <= 3;
      if (opts.createdFilter === "7days") return diff <= 7;
      if (opts.createdFilter === "30days") return diff <= 30;
      return true;
    });
  }
  
  return words;
}

export async function getDueWords(uid: string): Promise<Word[]> {
  const now = new Date(); 
  const q = query(wordsCol(uid), where("nextReviewAt", "<=", Timestamp.fromDate(now)));
  const snap = await getDocs(q);
  const dueWords = snap.docs.map((d) => toWord(d.id, d.data()));
  
  const qNull = query(wordsCol(uid), where("nextReviewAt", "==", null));
  const snapNull = await getDocs(qNull);
  const newWords = snapNull.docs.map((d) => toWord(d.id, d.data()));

  const map = new Map<string, Word>();
  [...dueWords, ...newWords].forEach(word => {
    map.set(word.id, word);
  });

  // Quét thêm trường hợp phòng vệ dữ liệu lỗi (chuỗi rỗng hoặc Invalid Date format từ DB cũ)
  const allSnap = await getDocs(wordsCol(uid));
  allSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.nextReviewAt === "" || data.nextReviewAt === undefined) {
      const parsed = toWord(d.id, data);
      map.set(parsed.id, parsed);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.masteryLevel - b.masteryLevel);
}

export async function getDailyWord(uid: string): Promise<Word | null> {
  const snap = await getDocs(wordsCol(uid)); 
  if (snap.empty) return null;
  
  const words = snap.docs.map((d) => toWord(d.id, d.data())); 
  words.sort((a, b) => a.id.localeCompare(b.id));

  const dayIndex = Math.floor(Date.now() / 86400000); 
  return words[dayIndex % words.length];
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
    lastReviewedAt: Timestamp.fromDate(new Date()), 
    nextReviewAt: Timestamp.fromDate(nextReview) 
  });
  const updated = await getDoc(ref); 
  return toWord(updated.id, updated.data()!);
}

export async function searchWords(uid: string, keyword: string): Promise<Word[]> {
  const words = await listWords(uid);
  const s = keyword.toLowerCase();
  return words.filter(
    (w) =>
      w.term.toLowerCase().includes(s) ||
      w.definition.toLowerCase().includes(s) ||
      (w.synonyms ?? []).join(" ").toLowerCase().includes(s)
  );
}

/* ================= GROUP FUNCTIONS ================= */

export async function createGroup(uid: string, name: string, parentId: string | null = null) {
  const ref = doc(groupsCol(uid));
  let path: string[] = [];

  if (parentId) {
    const parentSnap = await getDoc(doc(db, "users", uid, "groups", parentId));
    if (parentSnap.exists()) {
      const parent = parentSnap.data();
      path = [...(parent.path ?? []), parentId];
    }
  }

  await setDoc(ref, {
    name,
    parentId,
    path,
    wordCount: 0,
    childrenCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function listGroups(uid: string): Promise<Group[]> { 
  const snap = await getDocs(groupsCol(uid)); 
  return snap.docs.map((d) => toGroup(d.id, d.data())); 
}

export async function getGroup(uid: string, groupId: string): Promise<Group | null> {
  const ref = doc(db, "users", uid, "groups", groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toGroup(snap.id, snap.data());
}

export async function updateGroup(uid: string, groupId: string, data: Partial<Group>) { 
  await updateDoc(doc(db, "users", uid, "groups", groupId), { ...data, updatedAt: serverTimestamp() }); 
}

export async function deleteGroup(uid: string, groupId: string) { 
  await deleteDoc(doc(db, "users", uid, "groups", groupId)); 
}

export async function getChildGroups(uid: string, parentId: string): Promise<Group[]> {
  const q = query(groupsCol(uid), where("parentId", "==", parentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toGroup(d.id, d.data()));
}

export async function getAllChildGroupIds(uid: string, parentId: string): Promise<string[]> {
  const groups = await listGroups(uid);
  const result: string[] = [];

  function dfs(id: string) {
    result.push(id);
    groups.filter((g) => g.parentId === id).forEach((g) => dfs(g.id));
  }
  dfs(parentId);
  return result;
}

export async function getWordsByGroup(uid: string, groupId: string): Promise<Word[]> { 
  return listWords(uid, { groupId });
}

export async function getWordsInGroup(uid: string, groupId: string): Promise<Word[]> {
  return listWords(uid, { groupId });
}

export async function getWordsByGroups(uid: string, groupIds: string[]): Promise<Word[]> {
  if (groupIds.length === 0) return [];
  const words = await listWords(uid);
  return words.filter((word) => (word.groupIds ?? []).some((id) => groupIds.includes(id)));
}

export async function getWordsInGroupTree(uid: string, groupId: string): Promise<Word[]> {
  const ids = await getAllChildGroupIds(uid, groupId);
  return getWordsByGroups(uid, ids);
}

export async function getQuizWords(uid: string, groupId?: string): Promise<Word[]> {
  if (!groupId) return listWords(uid);
  return getWordsInGroupTree(uid, groupId);
}

export async function getGroupTree(uid: string): Promise<GroupNode[]> {
  const [groups, words] = await Promise.all([listGroups(uid), listWords(uid)]); 
  const nodeMap: Record<string, GroupNode> = {};
  groups.forEach((g) => { nodeMap[g.id] = { ...g, subGroups: [], words: [] }; });
  
  // SỬA LỖI 1: Tạo bản sao độc lập dữ liệu tránh chồng lấn bộ nhớ tham chiếu (Deep Reference Mapping)
  words.forEach((w) => { 
    if (w.groupIds) {
      w.groupIds.forEach((gId) => { 
        if (nodeMap[gId]) nodeMap[gId].words.push({ ...w }); 
      });
    }
  });
  
  const rootNodes: GroupNode[] = [];
  groups.forEach((g) => { const node = nodeMap[g.id]; if (g.parentId && nodeMap[g.parentId]) nodeMap[g.parentId].subGroups.push(node); else rootNodes.push(node); });
  return rootNodes;
}

/* ================= WORD X GROUP INTERACTIONS ================= */

export async function addWordToGroup(uid: string, wordId: string, groupId: string) {
  const ref = doc(db, "users", uid, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const groupIds = [...(data.groupIds ?? [])];
  if (!groupIds.includes(groupId)) {
    groupIds.push(groupId);
    await updateDoc(ref, { groupIds });
  }
}

export async function moveWordToGroup(uid: string, wordId: string, groupId: string) {
  const ref = doc(db, "users", uid, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, {
    groupIds: [groupId],
  });
}

export async function removeWordFromGroup(uid: string, wordId: string, groupId: string) {
  const ref = doc(db, "users", uid, "words", wordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  await updateDoc(ref, {
    groupIds: (data.groupIds ?? []).filter((id: string) => id !== groupId),
  });
}

export async function removeWordCompletelyFromGroup(uid: string, wordId: string, groupId: string) {
  await removeWordFromGroup(uid, wordId, groupId);
}

/* ================= STREAK & STATS ================= */

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
  if (last === today) return data.currentStreak ?? 1;
  
  const newStreak = last === yesterday ? (data.currentStreak ?? 0) + 1 : 1;
  await updateDoc(ref, { currentStreak: newStreak, lastStudiedDate: today }); 
  return newStreak;
}

export async function getStats(uid: string): Promise<Stats> {
  const now = new Date(); 
  const [wordsSnap, metaSnap] = await Promise.all([getDocs(wordsCol(uid)), getDoc(userDoc(uid))]);
  const words = wordsSnap.docs.map((d) => toWord(d.id, d.data())); 
  const totalWords = words.length; 
  const masteredWords = words.filter((w) => w.masteryLevel >= 5).length;
  
  const dueForReview = words.filter((w) => {
    if (!w.nextReviewAt) return true;
    const reviewDate = new Date(w.nextReviewAt);
    return !isNaN(reviewDate.getTime()) && reviewDate <= now;
  }).length; 
  
  const totalReviews = words.reduce((s, w) => s + w.reviewCount, 0);
  const totalCorrect = words.reduce((s, w) => s + w.correctCount, 0); 
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  
  // SỬA LỖI 2: Tính toán chính xác logic Streak hiển thị thực tế
  const meta = metaSnap.exists() ? metaSnap.data() : null; 
  const lastStudied = meta?.lastStudiedDate; 
  const today = todayKey(); 
  const yesterday = yesterdayKey();
  
  let currentStreak = 0;
  if (meta) {
    if (lastStudied === today || lastStudied === yesterday) {
      currentStreak = meta.currentStreak ?? 0;
    }
  }
  
  return { 
    totalWords, 
    masteredWords, 
    dueForReview, 
    accuracy, 
    currentStreak
  };
}
