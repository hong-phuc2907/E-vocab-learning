import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import {
  listWords,
  reviewWord,
  updateStreak,
  type Word,
} from "@/lib/firestore";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  GraduationCap,
} from "lucide-react";

import { Link } from "wouter";
import { MascotCelebration } from "@/components/mascot-celebration";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

type QuizMode =
  | "multiple-choice"
  | "fill-all"
  | "multi-select"
  | "mixed";

interface QuizQuestion {
  wordId: string;
  term: string;
  definition: string;

  options: string[];

  type: QuizMode;

  correctWords: string[];
}

export default function Quiz() {
  const { user } = useAuth();

  const [allWords, setAllWords] =
    useState<Word[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [started, setStarted] =
    useState(false);

  const [done, setDone] =
    useState(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [answers, setAnswers] =
    useState<boolean[]>([]);

  const [selected, setSelected] =
    useState<string | null>(null);

  const [isPending, setIsPending] =
    useState(false);

  const [quizMode, setQuizMode] =
    useState<QuizMode>("multiple-choice");

  const [questionCount, setQuestionCount] =
    useState(10);

  const [textAnswer, setTextAnswer] =
    useState("");

  const [selectedWords, setSelectedWords] =
    useState<string[]>([]);

  const [checked, setChecked] =
    useState(false);

  useEffect(() => {
    if (!user) return;

    listWords(user.uid).then((words) => {
      setAllWords(words);
      setIsLoading(false);
    });
  }, [user]);

  const questions =
    useMemo<QuizQuestion[]>(() => {
      if (
        !started ||
        allWords.length < 2
      ) {
        return [];
      }

      const pool = shuffle(allWords)
        .slice(
          0,
          Math.min(
            questionCount,
            allWords.length
          )
        );

      return pool.map((word) => {
        const synonyms =
          word.synonyms ?? [];

        const correctWords = [
          word.term,
          ...synonyms,
        ];

        let type: QuizMode =
          quizMode;

        if (quizMode === "mixed") {
          const modes: QuizMode[] = [
            "multiple-choice",
            "fill-all",
            "multi-select",
          ];

          type =
            modes[
              Math.floor(
                Math.random() *
                  modes.length
              )
            ];
        }

        const distractors = shuffle(
          allWords
            .filter(
              (w) =>
                w.id !== word.id
            )
            .map((w) => w.definition)
        ).slice(0, 3);

        return {
          wordId: word.id,
          term: word.term,
          definition:
            word.definition,

          options: shuffle([
            word.definition,
            ...distractors,
          ]),

          correctWords,

          type,
        };
      });
    }, [
      allWords,
      started,
      quizMode,
      questionCount,
    ]);

  const currentQ =
    questions[currentIndex];

  const progress =
    questions.length > 0
      ? (currentIndex /
          questions.length) *
        100
      : 0;
  const handleMultipleChoice =
    async (option: string) => {
      if (
        selected !== null ||
        !user ||
        !currentQ
      ) {
        return;
      }

      setSelected(option);

      const correct =
        option ===
        currentQ.definition;

      if (correct) {
        setScore(
          (s) => s + 1
        );
      }

      setAnswers((a) => [
        ...a,
        correct,
      ]);

      setIsPending(true);

      await reviewWord(
        user.uid,
        currentQ.wordId,
        correct
      );

      if (currentIndex === 0) {
        updateStreak(
          user.uid
        );
      }

      setIsPending(false);
    };

  const handleFillAll =
    async () => {
      if (
        !currentQ ||
        !user
      ) {
        return;
      }

      const userWords =
        textAnswer
          .toLowerCase()
          .split(",")
          .map((s) =>
            s.trim()
          )
          .filter(Boolean);

      const correctWords =
        currentQ.correctWords.map(
          (w) =>
            w.toLowerCase()
        );

      const allCorrect =
        correctWords.every(
          (w) =>
            userWords.includes(
              w
            )
        );

      if (allCorrect) {
        setScore(
          (s) => s + 1
        );
      }

      setAnswers((a) => [
        ...a,
        allCorrect,
      ]);

      setSelected(
        "__answered__"
      );

      await reviewWord(
        user.uid,
        currentQ.wordId,
        allCorrect
      );
    };

  const handleMultiSelect =
    async () => {
      if (
        !currentQ ||
        !user
      ) {
        return;
      }

      const selectedLower =
        selectedWords.map(
          (w) =>
            w.toLowerCase()
        );

      const correctLower =
        currentQ.correctWords.map(
          (w) =>
            w.toLowerCase()
        );

      const correct =
        correctLower.every(
          (w) =>
            selectedLower.includes(
              w
            )
        ) &&
        selectedLower.every(
          (w) =>
            correctLower.includes(
              w
            )
        );

      if (correct) {
        setScore(
          (s) => s + 1
        );
      }

      setAnswers((a) => [
        ...a,
        correct,
      ]);

      setSelected(
        "__answered__"
      );

      await reviewWord(
        user.uid,
        currentQ.wordId,
        correct
      );
    };

  const handleNext =
    () => {
      setSelected(null);

      setTextAnswer("");

      setSelectedWords(
        []
      );

      setChecked(false);

      if (
        currentIndex + 1 >=
        questions.length
      ) {
        setDone(true);
      } else {
        setCurrentIndex(
          (i) => i + 1
        );
      }
    };

  const handleRestart =
    () => {
      setStarted(false);

      setDone(false);

      setCurrentIndex(0);

      setScore(0);

      setAnswers([]);

      setSelected(null);

      setTextAnswer("");

      setSelectedWords(
        []
      );

      setChecked(false);
    };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Đang tải...
          </div>
        </div>
      </Layout>
    );
  }

  if (
    allWords.length < 4
  ) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap className="w-16 h-16 mb-4" />

          <h2 className="text-2xl font-bold">
            Chưa đủ từ
          </h2>

          <p>
            Cần ít nhất
            4 từ vựng
          </p>

          <Button
            asChild
            className="mt-4"
          >
            <Link href="/words/new">
              Thêm từ
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }
