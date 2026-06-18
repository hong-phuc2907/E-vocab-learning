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
  Clock,
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

type DateFilter =
  | "all"
  | "today"
  | "yesterday"
  | "3days"
  | "7days";

interface QuizQuestion {
  wordId: string;

  term: string;

  correctDefinition: string;

  options: string[];

  type: QuizMode;

  correctWords: string[];
}

const GRADE_LABELS: Record<
  string,
  string
> = {
  Excellent: "Xuất sắc",
  "Good work": "Tốt lắm",
  "Keep practicing":
    "Tiếp tục luyện tập",
  "Needs work":
    "Cần cải thiện",
};

function normalizeAnswer(
  value: string
) {
  return value
    .toLowerCase()
    .trim();
}

function parseAnswers(
  value: string
) {
  return value
    .split(",")
    .map((v) =>
      normalizeAnswer(v)
    )
    .filter(Boolean);
}

export default function Quiz() {
  const { user } = useAuth();

  const [allWords, setAllWords] =
    useState<Word[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [started, setStarted] =
    useState(false);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [selected, setSelected] =
    useState<string | null>(null);

  const [score, setScore] =
    useState(0);

  const [done, setDone] =
    useState(false);

  const [answers, setAnswers] =
    useState<boolean[]>([]);

  const [isPending, setIsPending] =
    useState(false);

  const [quizMode, setQuizMode] =
    useState<QuizMode>(
      "multiple-choice"
    );

  const [
    questionCount,
    setQuestionCount,
  ] = useState(10);

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [textAnswer, setTextAnswer] =
    useState("");

  const [
    selectedWords,
    setSelectedWords,
  ] = useState<string[]>([]);

  const [
    fillResult,
    setFillResult,
  ] = useState<{
    correct: string[];
    wrong: string[];
    missing: string[];
  } | null>(null);

  const [
    multiChecked,
    setMultiChecked,
  ] = useState(false);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  useEffect(() => {
    if (!user) return;

    listWords(user.uid).then(
      (words) => {
        setAllWords(words);
        setIsLoading(false);
      }
    );
  }, [user]);

  useEffect(() => {
    if (!started || done) return;

    const timer = setInterval(() => {
      setElapsedSeconds(
        (s) => s + 1
      );
    }, 1000);

    return () =>
      clearInterval(timer);
  }, [started, done]);

  const formatTime = (
    sec: number
  ) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;

    return `${m
      .toString()
      .padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };
  const filteredWords = useMemo(() => {
    if (dateFilter === "all") {
      return allWords;
    }

    const now = new Date();

    return allWords.filter((word) => {
      if (!word.createdAt) {
        return true;
      }

      const created = new Date(
        word.createdAt
      );

      const diffDays = Math.floor(
        (now.getTime() -
          created.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      switch (dateFilter) {
        case "today":
          return diffDays === 0;

        case "yesterday":
          return diffDays === 1;

        case "3days":
          return diffDays <= 3;

        case "7days":
          return diffDays <= 7;

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
      ) {
        return [];
      }

      const uniqueWords = shuffle([
        ...filteredWords,
      ]).slice(
        0,
        Math.min(
          questionCount,
          filteredWords.length
        )
      );

      return uniqueWords.map(
        (word) => {
          let type: QuizMode =
            quizMode;

          if (
            quizMode === "mixed"
          ) {
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

          const correctWords =
            [
              word.term,
              ...(word.synonyms ??
                []),
            ];

          const uniqueDefinitions =
            [
              ...new Set(
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
              ),
            ];

          const distractors =
            shuffle(
              uniqueDefinitions
            ).slice(0, 3);

          let options =
            shuffle([
              word.definition,
              ...distractors,
            ]);

          options = [
            ...new Set(options),
          ];

          while (
            options.length < 4
          ) {
            const extra =
              filteredWords[
                Math.floor(
                  Math.random() *
                    filteredWords.length
                )
              ]?.definition;

            if (
              extra &&
              !options.includes(
                extra
              )
            ) {
              options.push(extra);
            }
          }

          return {
            wordId: word.id,
            term: word.term,
            correctDefinition:
              word.definition,
            options:
              shuffle(options),
            type,
            correctWords,
          };
        }
      );
    }, [
      filteredWords,
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

  const isCorrect =
    selected ===
    currentQ?.correctDefinition;

  const handleSelect =
    async (
      option: string
    ) => {
      if (
        selected !== null ||
        !user ||
        !currentQ
      )
        return;

      setSelected(option);

      const correct =
        option ===
        currentQ.correctDefinition;

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

      if (
        currentIndex === 0
      ) {
        updateStreak(
          user.uid
        );
      }

      setIsPending(false);
    };

  const handleFillCheck =
    async () => {
      if (
        !user ||
        !currentQ
      )
        return;

      const userAnswers =
        parseAnswers(
          textAnswer
        );

      const correctWords =
        currentQ.correctWords.map(
          normalizeAnswer
        );

      const correct =
        userAnswers.filter(
          (a) =>
            correctWords.includes(
              a
            )
        );

      const wrong =
        userAnswers.filter(
          (a) =>
            !correctWords.includes(
              a
            )
        );

      const missing =
        correctWords.filter(
          (a) =>
            !userAnswers.includes(
              a
            )
        );

      const success =
  correct.length === correctWords.length &&
  missing.length === 0 &&
  wrong.length === 0;

      setFillResult({
        correct,
        wrong,
        missing,
      });

      setSelected(
        success
          ? "correct"
          : "wrong"
      );

      if (success) {
        setScore(
          (s) => s + 1
        );
      }
      setAnswers((a) => [
        ...a,
        success,
      ]);

      await reviewWord(
        user.uid,
        currentQ.wordId,
        success
      );
    };

  const toggleMultiWord = (
    word: string
  ) => {
    if (multiChecked)
      return;

    setSelectedWords(
      (prev) => {
        if (
          prev.includes(word)
        ) {
          return prev.filter(
            (w) => w !== word
          );
        }

        return [
          ...prev,
          word,
        ];
      }
    );
  };

  const handleMultiCheck =
    async () => {
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
        correctWords.every(
          (w) =>
            selectedNormalized.includes(
              w
            )
        ) &&
        selectedNormalized.every(
          (w) =>
            correctWords.includes(
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

      setMultiChecked(
        true
      );

      await reviewWord(
        user.uid,
        currentQ.wordId,
        allCorrect
      );
    };

  const handleNext =
    () => {
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

      setSelectedWords(
        []
      );

      setFillResult(null);

      setMultiChecked(
        false
      );
    };

  const handleRestart =
    () => {
      setStarted(false);

      setCurrentIndex(
        0
      );

      setSelected(null);

      setScore(0);

      setDone(false);

      setAnswers([]);

      setTextAnswer("");

      setSelectedWords(
        []
      );

      setFillResult(null);

      setMultiChecked(
        false
      );

      setElapsedSeconds(
        0
      );
    };

  const multiOptions =
    useMemo(() => {
      if (
        !currentQ ||
        currentQ.type !==
          "multi-select"
      ) {
        return [];
      }

      const correct =
        currentQ.correctWords;

      const wrong =
        shuffle(
          filteredWords
            .filter(
              (w) =>
                !correct.includes(
                  w.term
                )
            )
            .map(
              (w) => w.term
            )
        ).slice(0, 7);

      return shuffle([
        ...correct,
        ...wrong,
      ]).slice(0, 10);
    }, [
      currentQ,
      filteredWords,
    ]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Đang chuẩn bị bài
            kiểm tra...
          </div>
        </div>
      </Layout>
    );
  }

  if (
    filteredWords.length <
    4
  ) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <GraduationCap className="w-16 h-16 text-muted-foreground" />

          <h2 className="text-2xl font-bold">
            Không đủ từ
          </h2>

          <p className="text-muted-foreground">
            Hãy thêm ít nhất
            4 từ phù hợp bộ
            lọc đã chọn
          </p>
        </div>
      </Layout>
    );
  }if (!started) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-12 text-center space-y-6">

          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-serif font-bold">
              Bài kiểm tra từ vựng
            </h1>

            <p className="text-muted-foreground mt-2">
              Kiểm tra từ vựng theo nhiều chế độ
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">

            <select
              className="w-full border rounded-lg p-2"
              value={quizMode}
              onChange={(e) =>
                setQuizMode(
                  e.target.value as QuizMode
                )
              }
            >
              <option value="multiple-choice">
                Trắc nghiệm
              </option>

              <option value="fill-all">
                Điền tất cả đáp án
              </option>

              <option value="multi-select">
                Chọn tất cả đáp án đúng
              </option>

              <option value="mixed">
                Kết hợp
              </option>
            </select>

            <select
              className="w-full border rounded-lg p-2"
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
              className="w-full border rounded-lg p-2"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value as DateFilter
                )
              }
            >
              <option value="all">
                Tất cả từ
              </option>

              <option value="today">
                Thêm hôm nay
              </option>

              <option value="yesterday">
                Thêm hôm qua
              </option>

              <option value="3days">
                Trong 3 ngày
              </option>

              <option value="7days">
                Trong 7 ngày
              </option>
            </select>

          </div>

          <Button
            size="lg"
            className="w-full max-w-xs"
            onClick={() =>
              setStarted(true)
            }
          >
            Bắt đầu kiểm tra
          </Button>
        </div>
      </Layout>
    );
  }

  if (done) {
    const pct = Math.round(
      (score /
        questions.length) *
        100
    );

    const celebMsg =
      pct >= 90
        ? "Xuất sắc 🏆"
        : pct >= 70
        ? "Tốt lắm 🎉"
        : pct >= 50
        ? "Tiếp tục cố gắng 💪"
        : "Cần luyện thêm 📚";

    return (
      <Layout>
        <div className="max-w-lg mx-auto flex flex-col items-center py-10 text-center space-y-6">

          <MascotCelebration
            message={celebMsg}
            subMessage={`Bạn đạt ${score}/${questions.length}`}
          />

          <div className="text-6xl font-bold text-primary">
            {pct}%
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(
              elapsedSeconds
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {answers.map(
              (
                correct,
                i
              ) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    correct
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {i + 1}
                </div>
              )
            )}
          </div>

          <div className="flex gap-3">

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
                Tổng quan
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

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              Kiểm tra
            </h1>

            <p className="text-sm text-muted-foreground">
              Câu {currentIndex + 1}
              {" / "}
              {questions.length}
            </p>
          </div>

          <div className="text-right">

            <div className="text-green-600 font-bold">
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
        <div className="bg-card border rounded-2xl p-8">

          {currentQ?.type ===
            "multiple-choice" && (
            <>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Từ này có nghĩa là gì?
              </p>

              <h2 className="text-4xl font-bold text-center mb-6">
                {currentQ.term}
              </h2>

              <div className="grid gap-3">

                {currentQ.options.map(
                  (option, i) => {
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
                      if (correct) {
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
                        key={i}
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
                          65 + i
                        )}
                        . {option}
                      </button>
                    );
                  }
                )}

              </div>
            </>
          )}

          {currentQ?.type ===
            "fill-all" && (
            <>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Điền tất cả từ đúng
              </p>

              <h2 className="text-3xl font-bold text-center mb-6">
                {
                  currentQ.correctDefinition
                }
              </h2>

              <input
                className="w-full border rounded-lg p-3"
                placeholder="big, large..."
                value={textAnswer}
                onChange={(e) =>
                  setTextAnswer(
                    e.target.value
                  )
                }
              />

              {!fillResult && (
                <Button
                  className="w-full mt-4"
                  onClick={
                    handleFillCheck
                  }
                >
                  Kiểm tra
                </Button>
              )}

              {fillResult && (
                <div className="mt-4 space-y-2 text-sm">

                  <div className="font-bold">
                    Đúng:
                    {" "}
                    {
                      fillResult.correct
                        .length
                    }
                    /
                    {
                      currentQ
                        .correctWords
                        .length
                    }
                  </div>

                  <div className="text-green-700">
                    Đúng:
                    {" "}
                    {fillResult.correct.join(
                      ", "
                    )}
                  </div>

                  <div className="text-red-700">
                    Sai:
                    {" "}
                    {fillResult.wrong.join(
                      ", "
                    )}
                  </div>

                  <div className="text-blue-700">
                    Thiếu:
                    {" "}
                    {fillResult.missing.join(
                      ", "
                    )}
                  </div>

                </div>
              )}
            </>
          )}

          {currentQ?.type ===
            "multi-select" && (
            <>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Chọn tất cả từ đúng
              </p>

              <h2 className="text-3xl font-bold text-center mb-6">
                {
                  currentQ.correctDefinition
                }
              </h2>

              <div className="grid grid-cols-2 gap-3">

                {multiOptions.map(
                  (word) => {
                    const selectedNow =
                      selectedWords.includes(
                        word
                      );

                    const isCorrect =
                      currentQ.correctWords.includes(
                        word
                      );

                    let cls =
                      "p-3 rounded-lg border ";

                    if (
                      multiChecked
                    ) {
                      if (
                        isCorrect &&
                        selectedNow
                      ) {
                        cls +=
                          "bg-green-100 border-green-500";
                      } else if (
                        isCorrect &&
                        !selectedNow
                      ) {
                        cls +=
                          "bg-blue-100 border-blue-500";
                      } else if (
                        !isCorrect &&
                        selectedNow
                      ) {
                        cls +=
                          "bg-red-100 border-red-500";
                      }
                    }

                    return (
                      <button
                        key={word}
                        className={
                          cls
                        }
                        onClick={() =>
                          toggleMultiWord(
                            word
                          )
                        }
                      >
                        {word}
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

        {((currentQ?.type ===
          "multiple-choice" &&
          selected !== null) ||
          (currentQ?.type ===
            "fill-all" &&
            fillResult) ||
          (currentQ?.type ===
            "multi-select" &&
            multiChecked)) && (
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
