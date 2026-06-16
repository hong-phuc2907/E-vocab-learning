import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, wordsTable } from "@workspace/db";
import {
  ListWordsQueryParams,
  CreateWordBody,
  GetWordParams,
  GetWordResponse,
  UpdateWordParams,
  UpdateWordBody,
  UpdateWordResponse,
  DeleteWordParams,
  ReviewWordParams,
  ReviewWordBody,
  ReviewWordResponse,
  ListWordsResponseItem,
} from "@workspace/api-zod";

function serializeWord(w: Record<string, unknown>) {
  return {
    ...w,
    lastReviewedAt: w.lastReviewedAt instanceof Date ? w.lastReviewedAt.toISOString() : (w.lastReviewedAt ?? null),
    nextReviewAt: w.nextReviewAt instanceof Date ? w.nextReviewAt.toISOString() : (w.nextReviewAt ?? null),
    createdAt: w.createdAt instanceof Date ? (w.createdAt as Date).toISOString() : w.createdAt,
  };
}

const router: IRouter = Router();

function computeNextReview(masteryLevel: number): Date {
  const intervals = [1, 2, 4, 7, 14, 30];
  const days = intervals[Math.min(masteryLevel, intervals.length - 1)];
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next;
}

router.get("/words", async (req, res): Promise<void> => {
  const params = ListWordsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, search, difficulty, mastered } = params.data;
  const conditions = [];

  if (category) conditions.push(eq(wordsTable.category, category));
  if (difficulty) conditions.push(eq(wordsTable.difficulty, difficulty));
  if (search) {
    conditions.push(
      sql`(${ilike(wordsTable.term, `%${search}%`)} OR ${ilike(wordsTable.definition, `%${search}%`)})`
    );
  }
  if (mastered !== undefined) {
    if (mastered) {
      conditions.push(sql`${wordsTable.masteryLevel} >= 5`);
    } else {
      conditions.push(sql`${wordsTable.masteryLevel} < 5`);
    }
  }

  const words = await db
    .select()
    .from(wordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(wordsTable.createdAt);

  res.json(words.map((w) => ListWordsResponseItem.parse(serializeWord(w as any))));
});

router.post("/words", async (req, res): Promise<void> => {
  const parsed = CreateWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [word] = await db.insert(wordsTable).values(parsed.data).returning();
  res.status(201).json(GetWordResponse.parse(serializeWord(word as any)));
});

router.get("/words/daily", async (req, res): Promise<void> => {
  const allWords = await db.select().from(wordsTable);
  if (allWords.length === 0) {
    res.status(404).json({ error: "No words in your collection yet" });
    return;
  }
  const dayIndex = Math.floor(Date.now() / 86400000);
  const word = allWords[dayIndex % allWords.length];
  res.json(GetWordResponse.parse(serializeWord(word as any)));
});

router.get("/words/due", async (req, res): Promise<void> => {
  const now = new Date();
  const words = await db
    .select()
    .from(wordsTable)
    .where(
      sql`${wordsTable.nextReviewAt} IS NULL OR ${wordsTable.nextReviewAt} <= ${now}`
    )
    .orderBy(wordsTable.masteryLevel);

  res.json(words.map((w) => ListWordsResponseItem.parse(serializeWord(w as any))));
});

router.get("/words/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWordParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [word] = await db
    .select()
    .from(wordsTable)
    .where(eq(wordsTable.id, params.data.id));

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  res.json(GetWordResponse.parse(serializeWord(word as any)));
});

router.patch("/words/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateWordParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [word] = await db
    .update(wordsTable)
    .set(parsed.data)
    .where(eq(wordsTable.id, params.data.id))
    .returning();

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  res.json(UpdateWordResponse.parse(serializeWord(word as any)));
});

router.delete("/words/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteWordParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [word] = await db
    .delete(wordsTable)
    .where(eq(wordsTable.id, params.data.id))
    .returning();

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/words/:id/review", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReviewWordParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReviewWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(wordsTable)
    .where(eq(wordsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  const newReviewCount = existing.reviewCount + 1;
  const newCorrectCount = parsed.data.correct ? existing.correctCount + 1 : existing.correctCount;

  let newMastery = existing.masteryLevel;
  if (parsed.data.correct) {
    newMastery = Math.min(5, existing.masteryLevel + 1);
  } else {
    newMastery = Math.max(0, existing.masteryLevel - 1);
  }

  const nextReview = computeNextReview(newMastery);

  const [word] = await db
    .update(wordsTable)
    .set({
      reviewCount: newReviewCount,
      correctCount: newCorrectCount,
      masteryLevel: newMastery,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReview,
    })
    .where(eq(wordsTable.id, params.data.id))
    .returning();

  res.json(ReviewWordResponse.parse(serializeWord(word as any)));
});

export default router;
