import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wordsTable = pgTable("words", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  partOfSpeech: text("part_of_speech"),
  example: text("example"),
  pronunciation: text("pronunciation"),
  category: text("category"),
  difficulty: text("difficulty").notNull().default("medium"),
  masteryLevel: integer("mastery_level").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWordSchema = createInsertSchema(wordsTable).omit({
  id: true,
  masteryLevel: true,
  reviewCount: true,
  correctCount: true,
  lastReviewedAt: true,
  nextReviewAt: true,
  createdAt: true,
});

export type InsertWord = z.infer<typeof insertWordSchema>;
export type Word = typeof wordsTable.$inferSelect;
