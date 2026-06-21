import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  listWords,
  reviewWord,
  updateStreak,
  listGroups,
  type Word,
  type Group,
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];

  for (
    let i = a.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function normalizeAnswer(
  value: string
) {
  return value
    .toLowerCase()
    .trim();
}

function formatTime(
  sec: number
) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m
    .toString()
    .padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export default function Quiz() {
  const { user } = useAuth();

  const params =
    new URLSearchParams(
      window.location.search
    );

  const groupId =
    params.get("group");

  const [
    allWords,
    setAllWords,
  ] = useState<Word[]>([]);

  const [
    groups,
    setGroups,
  ] = useState<Group[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    score,
    setScore,
  ] = useState(0);

  const [
    done,
    setDone,
  ] = useState(false);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    quizMode,
    setQuizMode,
  ] = useState<QuizMode>(
    "multiple-choice"
  );

  const [
    questionCount,
    setQuestionCount,
  ] = useState(10);

  const [
    dateFilter,
    setDateFilter,
  ] = useState<DateFilter>(
    "all"
  );

  const [
    selected,
    setSelected,
  ] = useState<
    string | null
  >(null);

  const [
    answers,
    setAnswers,
  ] = useState<boolean[]>([]);

  const [
    textAnswer,
    setTextAnswer,
  ] = useState("");

  const [
    selectedWords,
    setSelectedWords,
  ] = useState<string[]>([]);

  const [
    multiChecked,
    setMultiChecked,
  ] = useState(false);

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState(
    groupId ?? "all"
  );

  useEffect(() => {
    if (!user) return;

    Promise.all([
      listWords(user.uid),
      listGroups(user.uid),
    ]).then(
      ([words, groups]) => {
        setAllWords(
          words ?? []
        );

        setGroups(
          groups ?? []
        );

        setIsLoading(
          false
        );
      }
    );
  }, [user]);

  useEffect(() => {
    if (
      !started ||
      done
    )
      return;

    const timer =
      setInterval(() => {
        setElapsedSeconds(
          (s) => s + 1
        );
      }, 1000);

    return () =>
      clearInterval(
        timer
      );
  }, [started, done]);

  const filteredWords =
    useMemo(() => {
      let words = [
        ...allWords,
      ];

      if (
        selectedGroup !==
        "all"
      ) {
        const groupIds =
          groups
            .filter(
              (g) =>
                g.id ===
                  selectedGroup ||
                g.path?.includes(
                  selectedGroup
                )
            )
            .map(
              (g) => g.id
            );

        words =
          words.filter(
            (w) =>
              w.groupIds?.some(
                (id) =>
                  groupIds.includes(
                    id
                  )
              )
          );
      }

      if (
        dateFilter !==
        "all"
      ) {
        const now =
          new Date();

        words =
          words.filter(
            (word) => {
              if (
                !word.createdAt
              )
                return true;

              const created =
                new Date(
                  word.createdAt
                );

              const diffDays =
                Math.floor(
                  (now.getTime() -
                    created.getTime()) /
                    86400000
                );

              switch (
                dateFilter
              ) {
                case "today":
                  return (
                    diffDays ===
                    0
                  );

                case "yesterday":
                  return (
                    diffDays ===
                    1
                  );

                case "3days":
                  return (
                    diffDays <=
                    3
                  );

                case "7days":
                  return (
                    diffDays <=
                    7
                  );

                default:
                  return true;
              }
            }
          );
      }

      return words;
    }, [
      allWords,
      groups,
      selectedGroup,
      dateFilter,
    ]);

  const questions =
    useMemo<
      QuizQuestion[]
    >(() => {
      if (
        !started ||
        filteredWords.length <
          4
      )
        return [];

      const picked =
        shuffle(
          filteredWords
        ).slice(
          0,
          Math.min(
            questionCount,
            filteredWords.length
          )
        );

      return picked.map(
        (word) => {
          let type =
            quizMode;

          if (
            quizMode ===
            "mixed"
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

        const filteredWords = useMemo(() => {
    let words = [...allWords];

    // Lọc theo nhóm (bao gồm nhóm con)
    if (selectedGroup !== "all") {
      const groupIds = groups
        .filter(
          (g) =>
            g.id === selectedGroup ||
            g.path?.includes(selectedGroup)
        )
        .map((g) => g.id);

      words = words.filter((w) =>
        w.groupIds?.some((id) =>
          groupIds.includes(id)
        )
      );
    }

    // Lọc theo ngày
    if (dateFilter !== "all") {
      const now = new Date();

      words = words.filter((word) => {
        if (!word.createdAt) return true;

        const created = new Date(word.createdAt);

        const diffDays = Math.floor(
          (now.getTime() - created.getTime()) /
            86400000
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
    }

    return words;
  }, [
    allWords,
    groups,
    selectedGroup,
    dateFilter,
  ]);

  const questions = useMemo<
    QuizQuestion[]
  >(() => {
    if (
      !started ||
      filteredWords.length < 4
    )
      return [];

    const uniqueWords = shuffle([
      ...filteredWords,
    ]).slice(
      0,
      Math.min(
        questionCount,
        filteredWords.length
      )
    );

    return uniqueWords.map((word) => {
      let type: QuizMode = quizMode;

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

      const sameMeaningWords =
        allWords
          .filter(
            (w) =>
              w.definition
                .toLowerCase()
                .trim() ===
              word.definition
                .toLowerCase()
                .trim()
          )
          .map((w) =>
            w.term
              .toLowerCase()
              .trim()
          );

      const correctWords = [
        ...new Set([
          ...sameMeaningWords,
          ...(word.synonyms ?? []).map(
            (s) =>
              s
                .toLowerCase()
                .trim()
          ),
        ]),
      ];

      const uniqueDefinitions = [
        ...new Set(
          filteredWords
            .filter(
              (w) =>
                w.id !== word.id &&
                w.definition !==
                  word.definition
            )
            .map(
              (w) => w.definition
            )
        ),
      ];

      const distractors =
        shuffle(
          uniqueDefinitions
        ).slice(0, 3);

      let options = shuffle([
        word.definition,
        ...distractors,
      ]);

      options = [...new Set(options)];

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
          !options.includes(extra)
        ) {
          options.push(extra);
        }
      }

      return {
        wordId: word.id,
        term: word.term,
        correctDefinition:
          word.definition,
        options: shuffle(options),
        type,
        correctWords,
      };
    });
  }, [
    filteredWords,
    started,
    quizMode,
    questionCount,
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

      const wrong = shuffle(
        filteredWords
          .filter(
            (w) =>
              !correct.includes(
                w.term
              )
          )
          .map((w) => w.term)
      ).slice(0, 7);

      return shuffle([
        ...correct,
        ...wrong,
      ]).slice(0, 10);
    }, [
      currentQ,
      filteredWords,
    ]);

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
    };

  const handleFillAllCheck =
    async () => {
      if (
        !user ||
        !currentQ
      )
        return;

      const entered =
        textAnswer
          .split(",")
          .map((x) =>
            x
              .trim()
              .toLowerCase()
          )
          .filter(Boolean);

      const correct =
        currentQ.correctWords.map(
          (x) =>
            x
              .toLowerCase()
              .trim()
        );

      const isCorrect =
        correct.every((w) =>
          entered.includes(w)
        ) &&
        entered.every((w) =>
          correct.includes(w)
        );

      if (isCorrect) {
        setScore(
          (s) => s + 1
        );
      }

      setAnswers((a) => [
        ...a,
        isCorrect,
      ]);

      setSelected(
        isCorrect
          ? "__correct__"
          : "__wrong__"
      );

      await reviewWord(
        user.uid,
        currentQ.wordId,
        isCorrect
      );
    };
          if (done) {
    const pct = Math.round(
      (score / questions.length) * 100
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
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {answers.map(
              (correct, i) => (
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
              onClick={handleRestart}
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
              Câu {currentIndex + 1} /{" "}
              {questions.length}
            </p>
          </div>

          <div className="text-right">
            <div className="text-green-600 font-bold">
              {score}
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        <Progress
          value={progress}
          className="h-2"
        />

        <div className="bg-card border rounded-2xl p-8">

          {/* MULTIPLE CHOICE */}
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
                      selected === option;

                    let cls =
                      "w-full p-4 rounded-xl border-2 text-left ";

                    if (selected !== null) {
                      if (correct)
                        cls +=
                          "bg-green-50 border-green-500";
                      else if (isSelected)
                        cls +=
                          "bg-red-50 border-red-500";
                      else
                        cls +=
                          "opacity-50";
                    }

                    return (
                      <button
                        key={i}
                        className={cls}
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

          {/* FILL ALL */}
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
                placeholder="Nhập các từ cách nhau bằng dấu phẩy"
                className="w-full border rounded-xl p-4 min-h-[120px]"
                disabled={
                  selected !== null
                }
              />

              {selected === null && (
                <Button
                  className="w-full"
                  onClick={
                    handleFillAllCheck
                  }
                >
                  Kiểm tra
                </Button>
              )}

              {selected !== null &&
                fillResult && (
                  <div className="rounded-xl border p-4 space-y-2">
                    <p>
                      Đúng:{" "}
                      {fillResult.correct
                        .length
                        ? fillResult.correct.join(
                            ", "
                          )
                        : "Không có"}
                    </p>

                    <p className="text-blue-600">
                      Thiếu:{" "}
                      {fillResult.missing
                        .length
                        ? fillResult.missing.join(
                            ", "
                          )
                        : "Không có"}
                    </p>

                    <p className="text-red-600">
                      Sai:{" "}
                      {fillResult.wrong
                        .length
                        ? fillResult.wrong.join(
                            ", "
                          )
                        : "Không có"}
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* MULTI SELECT */}
          {currentQ?.type ===
            "multi-select" && (
            <>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Chọn tất cả đáp án đúng
              </p>

              <h2 className="text-3xl font-bold text-center mb-6">
                {
                  currentQ.correctDefinition
                }
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {multiOptions.map(
                  (word) => {
                    const checked =
                      selectedWords.includes(
                        word
                      );

                    const isCorrect =
                      currentQ.correctWords.includes(
                        word
                      );

                    let cls =
                      "p-3 rounded-lg border ";

                    if (multiChecked) {
                      if (
                        checked &&
                        isCorrect
                      )
                        cls +=
                          "bg-green-100 border-green-500";
                      else if (
                        checked &&
                        !isCorrect
                      )
                        cls +=
                          "bg-red-100 border-red-500";
                      else
                        cls +=
                          "opacity-50";
                    }

                    return (
                      <button
                        key={word}
                        className={cls}
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
            selected !== null) ||
          (currentQ?.type ===
            "multi-select" &&
            multiChecked)) && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleNext}
          >
            {currentIndex + 1 >=
            questions.length
              ? "Xem kết quả"
              : "Câu tiếp theo"}
          </Button>
        )}
      </div>
    </Layout>
  );
        }
