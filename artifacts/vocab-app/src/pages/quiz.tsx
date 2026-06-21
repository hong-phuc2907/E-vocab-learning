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
  GraduationCap,
  Clock,
  RefreshCw,
} from "lucide-react";

import { Link } from "wouter";
import { MascotCelebration } from "@/components/mascot-celebration";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

type QuizMode =
  | "multiple-choice"
  | "fill-all"
  | "multi-select"
  | "mixed";

type DateFilter =
  | "all"
  | "today"
  | "yesterday"
  | "3days"
  | "7days"
  | "30days";

interface QuizQuestion {
  wordId: string;
  term: string;
  correctDefinition: string;
  options: string[];
  type: QuizMode;
  correctWords: string[];
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().trim();
}

export default function Quiz() {
  const { user } = useAuth();

  const [allWords, setAllWords] =
    useState<Word[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [started, setStarted] =
    useState(false);

  const [done, setDone] =
    useState(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [selected, setSelected] =
    useState<string | null>(null);

  const [answers, setAnswers] =
    useState<boolean[]>([]);

  const [quizMode, setQuizMode] =
    useState<QuizMode>("multiple-choice");

  const [questionCount, setQuestionCount] =
    useState(20);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [textAnswer, setTextAnswer] =
    useState("");

  const [selectedWords, setSelectedWords] =
    useState<string[]>([]);

  const [multiChecked, setMultiChecked] =
    useState(false);

  const [fillResult, setFillResult] =
    useState<{
      correct: string[];
      wrong: string[];
      missing: string[];
    } | null>(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const words = await listWords(user.uid);

      setAllWords(words);
      setLoading(false);
    }

    load();
  }, [user]);

  useEffect(() => {
    if (!started || done) return;

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, done]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;

    return `${m
      .toString()
      .padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  const filteredWords = useMemo(() => {
    if (dateFilter === "all")
      return allWords;

    const now = new Date();

    return allWords.filter((word) => {
      if (!word.createdAt)
        return false;

      const created =
        new Date(word.createdAt);

      const diff =
        Math.floor(
          (now.getTime() -
            created.getTime()) /
            86400000
        );

      switch (dateFilter) {
        case "today":
          return diff === 0;

        case "yesterday":
          return diff === 1;

        case "3days":
          return diff <= 3;

        case "7days":
          return diff <= 7;

        case "30days":
          return diff <= 30;

        default:
          return true;
      }
    });
  }, [allWords, dateFilter]);

  const questions =
    useMemo<QuizQuestion[]>(() => {
      if (
        !started ||
        filteredWords.length < 4
      )
        return [];

      const chosen = shuffle(
        filteredWords
      ).slice(
        0,
        Math.min(
          questionCount,
          filteredWords.length
        )
      );

      return chosen.map((word) => {
        let type: QuizMode =
          quizMode;

        if (quizMode === "mixed") {
          const modes: QuizMode[] =
            [
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

        const sameMeaningWords =
          allWords
            .filter(
              (w) =>
                normalizeAnswer(
                  w.definition
                ) ===
                normalizeAnswer(
                  word.definition
                )
            )
            .map((w) =>
              normalizeAnswer(
                w.term
              )
            );

        const correctWords = [
          ...new Set([
            ...sameMeaningWords,
            ...(
              word.synonyms ?? []
            ).map((s) =>
              normalizeAnswer(
                s
              )
            ),
          ]),
        ];

        const distractors =
          shuffle(
            filteredWords
              .filter(
                (w) =>
                  w.id !==
                    word.id &&
                  w.definition !==
                    word.definition
              )
              .map(
                (w) =>
                  w.definition
              )
          ).slice(0, 3);

        const options =
          shuffle([
            word.definition,
            ...distractors,
          ]);

        return {
          wordId: word.id,
          term: word.term,
          correctDefinition:
            word.definition,
          options,
          type,
          correctWords,
        };
      });
    }, [
      started,
      filteredWords,
      questionCount,
      quizMode,
      allWords,
    ]);

  const currentQ =
    questions[currentIndex];

  const progress =
    questions.length > 0
      ? (currentIndex /
          questions.length) *
        100
      : 0;
  async function handleSelect(
    option: string
  ) {
    if (
      selected !== null ||
      !currentQ ||
      !user
    )
      return;

    const correct =
      option ===
      currentQ.correctDefinition;

    setSelected(option);

    if (correct) {
      setScore((s) => s + 1);
    }

    setAnswers((prev) => [
      ...prev,
      correct,
    ]);

    await reviewWord(
      user.uid,
      currentQ.wordId,
      correct
    );

    if (currentIndex === 0) {
      await updateStreak(user.uid);
    }
  }

  async function handleFillCheck() {
    if (
      !currentQ ||
      !user ||
      selected !== null
    )
      return;

    const entered =
      textAnswer
        .split(",")
        .map((v) =>
          normalizeAnswer(v)
        )
        .filter(Boolean);

    const correctAnswers =
      currentQ.correctWords.map(
        normalizeAnswer
      );

    const correct =
      entered.filter((v) =>
        correctAnswers.includes(v)
      );

    const wrong =
      entered.filter(
        (v) =>
          !correctAnswers.includes(v)
      );

    const missing =
      correctAnswers.filter(
        (v) =>
          !entered.includes(v)
      );

    const allCorrect =
      wrong.length === 0 &&
      missing.length === 0;

    setFillResult({
      correct,
      wrong,
      missing,
    });

    setSelected(
      allCorrect
        ? "__correct__"
        : "__wrong__"
    );

    if (allCorrect) {
      setScore((s) => s + 1);
    }

    setAnswers((prev) => [
      ...prev,
      allCorrect,
    ]);

    await reviewWord(
      user.uid,
      currentQ.wordId,
      allCorrect
    );
  }

  function toggleMultiWord(
    word: string
  ) {
    if (multiChecked) return;

    setSelectedWords((prev) => {
      if (prev.includes(word)) {
        return prev.filter(
          (w) => w !== word
        );
      }

      return [...prev, word];
    });
  }

  async function handleMultiCheck() {
    if (
      !currentQ ||
      !user
    )
      return;

    const correctWords =
      currentQ.correctWords.map(
        normalizeAnswer
      );

    const selectedNormalized =
      selectedWords.map(
        normalizeAnswer
      );

    const allCorrect =
      correctWords.every((w) =>
        selectedNormalized.includes(
          w
        )
      ) &&
      selectedNormalized.every(
        (w) =>
          correctWords.includes(w)
      );

    if (allCorrect) {
      setScore((s) => s + 1);
    }

    setAnswers((prev) => [
      ...prev,
      allCorrect,
    ]);

    setMultiChecked(true);

    await reviewWord(
      user.uid,
      currentQ.wordId,
      allCorrect
    );
  }

  function handleNext() {
    if (
      currentIndex + 1 >=
      questions.length
    ) {
      setDone(true);
      return;
    }

    setCurrentIndex(
      (i) => i + 1
    );

    setSelected(null);

    setTextAnswer("");

    setFillResult(null);

    setSelectedWords([]);

    setMultiChecked(false);
  }

  function handleRestart() {
    setStarted(false);

    setDone(false);

    setCurrentIndex(0);

    setScore(0);

    setAnswers([]);

    setSelected(null);

    setTextAnswer("");

    setFillResult(null);

    setSelectedWords([]);

    setMultiChecked(false);

    setElapsedSeconds(0);
  }

  const multiOptions =
    useMemo(() => {
      if (
        !currentQ ||
        currentQ.type !==
          "multi-select"
      )
        return [];

      const correct =
        currentQ.correctWords;

      const wrong =
        shuffle(
          filteredWords
            .filter(
              (w) =>
                !correct.includes(
                  normalizeAnswer(
                    w.term
                  )
                )
            )
            .map((w) => w.term)
        ).slice(0, 8);

      return shuffle([
        ...correct,
        ...wrong,
      ]);
    }, [
      currentQ,
      filteredWords,
    ]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          Đang tải...
        </div>
      </Layout>
    );
  }

  if (
    filteredWords.length < 4
  ) {
    return (
      <Layout>
        <div className="text-center py-20">
          <GraduationCap className="mx-auto w-16 h-16 mb-4" />

          <h2 className="text-2xl font-bold">
            Không đủ từ vựng
          </h2>

          <p className="text-muted-foreground">
            Cần ít nhất 4 từ
          </p>
        </div>
      </Layout>
    );
  }

  if (!started) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 space-y-5">

          <h1 className="text-3xl font-bold text-center">
            Quiz
          </h1>

          <select
            className="w-full border rounded-lg p-3"
            value={quizMode}
            onChange={(e) =>
              setQuizMode(
                e.target
                  .value as QuizMode
              )
            }
          >
            <option value="multiple-choice">
              Trắc nghiệm
            </option>

            <option value="fill-all">
              Điền từ
            </option>

            <option value="multi-select">
              Chọn nhiều đáp án
            </option>

            <option value="mixed">
              Kết hợp
            </option>
          </select>

          <select
            className="w-full border rounded-lg p-3"
            value={questionCount}
            onChange={(e) =>
              setQuestionCount(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value={10}>
              10 câu
            </option>

            <option value={20}>
              20 câu
            </option>

            <option value={30}>
              30 câu
            </option>

            <option value={50}>
              50 câu
            </option>

            <option value={100}>
              100 câu
            </option>
          </select>
          <select
            className="w-full border rounded-lg p-3"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(
                e.target
                  .value as DateFilter
              )
            }
          >
            <option value="all">
              Tất cả
            </option>

            <option value="today">
              Hôm nay
            </option>

            <option value="yesterday">
              Hôm qua
            </option>

            <option value="3days">
              Trong 3 ngày
            </option>

            <option value="7days">
              Trong 7 ngày
            </option>

            <option value="30days">
              Trong 1 tháng
            </option>
          </select>

          <Button
            className="w-full"
            onClick={() =>
              setStarted(true)
            }
          >
            Bắt đầu
          </Button>
        </div>
      </Layout>
    );
  }

  if (done) {
    const percent =
      Math.round(
        (score /
          questions.length) *
          100
      );

    const message =
      percent >= 90
        ? "Xuất sắc 🏆"
        : percent >= 70
        ? "Rất tốt 🎉"
        : percent >= 50
        ? "Tiếp tục cố gắng 💪"
        : "Cần ôn tập thêm 📚";

    return (
      <Layout>
        <div className="max-w-lg mx-auto py-10 text-center space-y-6">

          <MascotCelebration
            message={message}
            subMessage={`Bạn đạt ${score}/${questions.length}`}
          />

          <div className="text-6xl font-bold text-primary">
            {percent}%
          </div>

          <div className="flex justify-center items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(
              elapsedSeconds
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {answers.map(
              (
                correct,
                index
              ) => (
                <div
                  key={index}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    correct
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {index + 1}
                </div>
              )
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={
                handleRestart
              }
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm lại
            </Button>

            <Button asChild>
              <Link href="/">
                Trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Quiz
            </h1>

            <p className="text-sm text-muted-foreground">
              Câu{" "}
              {currentIndex + 1}
              /
              {questions.length}
            </p>
          </div>

          <div className="text-right">
            <div className="font-bold text-green-600">
              {score}
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(
                elapsedSeconds
              )}
            </div>
          </div>
        </div>

        <Progress
          value={progress}
          className="h-2"
        />

        <div className="border rounded-2xl p-8 bg-card">

          {currentQ?.type ===
            "multiple-choice" && (
            <>
              <p className="text-center text-muted-foreground mb-4">
                Từ này có nghĩa là gì?
              </p>

              <h2 className="text-4xl font-bold text-center mb-6">
                {currentQ.term}
              </h2>

              <div className="grid gap-3">

                {currentQ.options.map(
                  (
                    option,
                    index
                  ) => {
                    const correct =
                      option ===
                      currentQ.correctDefinition;

                    const isSelected =
                      selected ===
                      option;

                    let cls =
                      "w-full p-4 rounded-xl border-2 text-left ";

                    if (
                      selected !==
                      null
                    ) {
                      if (
                        correct
                      ) {
                        cls +=
                          "bg-green-50 border-green-500";
                      } else if (
                        isSelected
                      ) {
                        cls +=
                          "bg-red-50 border-red-500";
                      } else {
                        cls +=
                          "opacity-50";
                      }
                    }

                    return (
                      <button
                        key={
                          index
                        }
                        className={
                          cls
                        }
                        onClick={() =>
                          handleSelect(
                            option
                          )
                        }
                      >
                        {String.fromCharCode(
                          65 +
                            index
                        )}
                        .{" "}
                        {
                          option
                        }
                      </button>
                    );
                  }
                )}

              </div>
            </>
          )}
          {currentQ?.type ===
            "fill-all" && (
            <div className="space-y-4">

              <div className="bg-blue-50 border rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  Nghĩa
                </p>

                <p className="text-xl font-bold">
                  {
                    currentQ.correctDefinition
                  }
                </p>
              </div>

              <textarea
                value={textAnswer}
                onChange={(e) =>
                  setTextAnswer(
                    e.target.value
                  )
                }
                disabled={
                  selected !==
                  null
                }
                placeholder="Nhập các từ, cách nhau bằng dấu phẩy"
                className="w-full border rounded-xl p-4 min-h-[120px]"
              />

              {selected ===
                null && (
                <Button
                  className="w-full"
                  onClick={
                    handleFillCheck
                  }
                >
                  Kiểm tra
                </Button>
              )}

              {fillResult && (
                <div className="border rounded-xl p-4 space-y-3">

                  <div>
                    <p className="font-semibold text-green-600">
                      Đúng
                    </p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {fillResult.correct.map(
                        (
                          word
                        ) => (
                          <span
                            key={
                              word
                            }
                            className="px-2 py-1 rounded bg-green-100 text-green-700"
                          >
                            {
                              word
                            }
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-red-600">
                      Sai
                    </p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {fillResult.wrong.map(
                        (
                          word
                        ) => (
                          <span
                            key={
                              word
                            }
                            className="px-2 py-1 rounded bg-red-100 text-red-700"
                          >
                            {
                              word
                            }
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-blue-600">
                      Thiếu
                    </p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {fillResult.missing.map(
                        (
                          word
                        ) => (
                          <span
                            key={
                              word
                            }
                            className="px-2 py-1 rounded bg-blue-100 text-blue-700"
                          >
                            {
                              word
                            }
                          </span>
                        )
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {currentQ?.type ===
            "multi-select" && (
            <>
              <p className="text-center text-muted-foreground mb-4">
                Chọn tất cả từ đúng
              </p>

              <h2 className="text-3xl font-bold text-center mb-6">
                {
                  currentQ.correctDefinition
                }
              </h2>

              <div className="grid grid-cols-2 gap-3">

                {multiOptions.map(
                  (
                    word
                  ) => {
                    const checked =
                      selectedWords.includes(
                        word
                      );

                    const isCorrect =
                      currentQ.correctWords.includes(
                        normalizeAnswer(
                          word
                        )
                      );

                    let cls =
                      "p-3 rounded-lg border ";

                    if (
                      multiChecked
                    ) {
                      if (
                        checked &&
                        isCorrect
                      ) {
                        cls +=
                          "bg-green-100 border-green-500";
                      } else if (
                        checked &&
                        !isCorrect
                      ) {
                        cls +=
                          "bg-red-100 border-red-500";
                      } else if (
                        !checked &&
                        isCorrect
                      ) {
                        cls +=
                          "bg-blue-100 border-blue-500";
                      } else {
                        cls +=
                          "opacity-40";
                      }
                    } else {
                      cls += checked
                        ? "border-primary bg-primary/5"
                        : "";
                    }

                    return (
                      <button
                        key={
                          word
                        }
                        className={
                          cls
                        }
                        onClick={() =>
                          toggleMultiWord(
                            word
                          )
                        }
                      >
                        {
                          word
                        }
                      </button>
                    );
                  }
                )}

              </div>

              {!multiChecked && (
                <Button
                  className="w-full mt-4"
                  onClick={
                    handleMultiCheck
                  }
                >
                  Kiểm tra
                </Button>
              )}
            </>
          )}

        </div>

        {(
          (
            currentQ?.type ===
              "multiple-choice" &&
            selected !==
              null
          ) ||
          (
            currentQ?.type ===
              "fill-all" &&
            selected !==
              null
          ) ||
          (
            currentQ?.type ===
              "multi-select" &&
            multiChecked
          )
        ) && (
          <Button
            size="lg"
            className="w-full"
            onClick={
              handleNext
            }
          >
            {currentIndex +
              1 >=
            questions.length
              ? "Xem kết quả"
              : "Câu tiếp theo"}
          </Button>
        )}

      </div>
    </Layout>
  );
}
