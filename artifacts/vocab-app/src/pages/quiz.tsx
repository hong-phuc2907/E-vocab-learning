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
  if (!started) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Bài kiểm tra từ vựng
            </h1>

            <p className="text-muted-foreground mt-2">
              Chọn chế độ và số lượng câu hỏi
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
                Chọn tất cả từ đúng
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
                  Number(e.target.value)
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

          </div>

          <Button
            size="lg"
            className="w-full max-w-xs"
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

          <div className="flex flex-wrap gap-2 justify-center">
            {answers.map(
              (
                correct,
                index
              ) => (
                <div
                  key={index}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
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

        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Kiểm tra
            </h1>

            <p className="text-sm text-muted-foreground">
              Câu {currentIndex + 1} / {questions.length}
            </p>
          </div>

          <div>
            <span className="text-green-600 font-bold">
              {score}
            </span>
            <span>
              {" "}
              / {currentIndex}
            </span>
          </div>
        </div>

        <Progress
          value={progress}
          className="h-2"
        />
        <div className="bg-card border rounded-2xl p-8 text-center">

          {currentQ.type ===
            "multiple-choice" && (
            <>
              <p className="text-xs uppercase text-muted-foreground mb-3">
                Từ này có nghĩa là gì?
              </p>

              <h2 className="text-4xl font-bold mb-6">
                {currentQ.term}
              </h2>

              <div className="grid gap-3">

                {currentQ.options.map(
                  (
                    option,
                    i
                  ) => {
                    const isSelected =
                      selected ===
                      option;

                    const correct =
                      option ===
                      currentQ.definition;

                    let cls =
                      "w-full text-left p-4 rounded-xl border-2 ";

                    if (
                      selected !==
                      null
                    ) {
                      if (
                        correct
                      ) {
                        cls +=
                          "border-green-500 bg-green-100";
                      } else if (
                        isSelected
                      ) {
                        cls +=
                          "border-red-500 bg-red-100";
                      } else {
                        cls +=
                          "opacity-60";
                      }
                    }

                    return (
                      <button
                        key={i}
                        className={
                          cls
                        }
                        onClick={() =>
                          handleMultipleChoice(
                            option
                          )
                        }
                      >
                        {option}
                      </button>
                    );
                  }
                )}

              </div>
            </>
          )}

          {currentQ.type ===
            "fill-all" && (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Nghĩa
              </p>

              <h2 className="text-3xl font-bold mb-4">
                {
                  currentQ.definition
                }
              </h2>

              <input
                className="w-full border rounded-lg p-3"
                placeholder="big, large"
                value={
                  textAnswer
                }
                onChange={(
                  e
                ) =>
                  setTextAnswer(
                    e.target
                      .value
                  )
                }
              />

              {!selected && (
                <Button
                  className="mt-4 w-full"
                  onClick={
                    handleFillAll
                  }
                >
                  Kiểm tra
                </Button>
              )}

              {selected && (
                <div className="mt-4 text-left">

                  <p className="font-semibold text-blue-700">
                    Đáp án:
                  </p>

                  <ul className="mt-2">
                    {currentQ.correctWords.map(
                      (
                        word
                      ) => (
                        <li
                          key={
                            word
                          }
                        >
                          • {word}
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}
            </>
          )}

          {currentQ.type ===
            "multi-select" && (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Nghĩa
              </p>

              <h2 className="text-3xl font-bold mb-6">
                {
                  currentQ.definition
                }
              </h2>

              <div className="grid grid-cols-2 gap-3">

                {currentQ.options.map(
                  (
                    option
                  ) => {
                    const correct =
                      currentQ.correctWords.includes(
                        option
                      );

                    const chosen =
                      selectedWords.includes(
                        option
                      );

                    let color =
                      "";

                    if (
                      checked
                    ) {
                      if (
                        correct &&
                        chosen
                      ) {
                        color =
                          "bg-green-100 border-green-500";
                      } else if (
                        correct &&
                        !chosen
                      ) {
                        color =
                          "bg-blue-100 border-blue-500";
                      } else if (
                        !correct &&
                        chosen
                      ) {
                        color =
                          "bg-red-100 border-red-500";
                      }
                    }

                    return (
                      <button
                        key={
                          option
                        }
                        className={`border rounded-lg p-3 ${color}`}
                        onClick={() => {
                          if (
                            checked
                          )
                            return;

                          setSelectedWords(
                            (
                              prev
                            ) =>
                              prev.includes(
                                option
                              )
                                ? prev.filter(
                                    (
                                      w
                                    ) =>
                                      w !==
                                      option
                                  )
                                : [
                                    ...prev,
                                    option,
                                  ]
                          );
                        }}
                      >
                        {option}
                      </button>
                    );
                  }
                )}

              </div>

              {!checked && (
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    setChecked(
                      true
                    );
                    handleMultiSelect();
                  }}
                >
                  Kiểm tra
                </Button>
              )}
            </>
          )}

        </div>

        {selected && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleNext}
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
