import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, wordsTable } from "@workspace/db";
import { GetStatsResponse, ListCategoriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({
      totalWords: sql<number>`count(*)::int`,
      masteredWords: sql<number>`count(*) filter (where ${wordsTable.masteryLevel} >= 5)::int`,
      reviewedToday: sql<number>`count(*) filter (where ${wordsTable.lastReviewedAt} >= ${todayStart})::int`,
      totalReviews: sql<number>`coalesce(sum(${wordsTable.reviewCount}), 0)::int`,
      totalCorrect: sql<number>`coalesce(sum(${wordsTable.correctCount}), 0)::int`,
      dueForReview: sql<number>`count(*) filter (where ${wordsTable.nextReviewAt} IS NULL OR ${wordsTable.nextReviewAt} <= ${now})::int`,
      easyCount: sql<number>`count(*) filter (where ${wordsTable.difficulty} = 'easy')::int`,
      mediumCount: sql<number>`count(*) filter (where ${wordsTable.difficulty} = 'medium')::int`,
      hardCount: sql<number>`count(*) filter (where ${wordsTable.difficulty} = 'hard')::int`,
    })
    .from(wordsTable);

  const totalReviews = row?.totalReviews ?? 0;
  const totalCorrect = row?.totalCorrect ?? 0;
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  const wordsWithStreak = await db
    .select({ lastReviewedAt: wordsTable.lastReviewedAt })
    .from(wordsTable)
    .where(sql`${wordsTable.lastReviewedAt} IS NOT NULL`);

  const reviewedDays = new Set<string>();
  for (const w of wordsWithStreak) {
    if (w.lastReviewedAt) {
      reviewedDays.add(w.lastReviewedAt.toISOString().slice(0, 10));
    }
  }

  let currentStreak = 0;
  const checkDate = new Date();
  while (true) {
    const key = checkDate.toISOString().slice(0, 10);
    if (reviewedDays.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const stats = GetStatsResponse.parse({
    totalWords: row?.totalWords ?? 0,
    masteredWords: row?.masteredWords ?? 0,
    reviewedToday: row?.reviewedToday ?? 0,
    currentStreak,
    totalReviews,
    accuracy,
    dueForReview: row?.dueForReview ?? 0,
    byDifficulty: {
      easy: row?.easyCount ?? 0,
      medium: row?.mediumCount ?? 0,
      hard: row?.hardCount ?? 0,
    },
  });

  res.json(stats);
});

router.get("/categories", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      name: wordsTable.category,
      count: sql<number>`count(*)::int`,
      masteredCount: sql<number>`count(*) filter (where ${wordsTable.masteryLevel} >= 5)::int`,
    })
    .from(wordsTable)
    .where(sql`${wordsTable.category} IS NOT NULL`)
    .groupBy(wordsTable.category);

  const categories = rows.map((r) => ({
    name: r.name ?? "Uncategorized",
    count: r.count,
    masteredCount: r.masteredCount,
  }));

  res.json(ListCategoriesResponse.parse(categories));
});

export default router;
