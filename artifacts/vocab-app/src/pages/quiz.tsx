import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
listWords,
listGroups,
reviewWord,
updateStreak,
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

import { MascotCelebration } from "@/components/mascot-celebration";

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

function shuffle<T>(arr: T[]) {
const a = [...arr];

for (
let i = a.length - 1;
i > 0;
i--
) {
const j = Math.floor(
Math.random() * (i + 1)
);

[a[i], a[j]] = [
  a[j],
  a[i],
];

}

return a;
}

function normalize(
text: string
) {
return text
.toLowerCase()
.trim();
}

function formatTime(
sec: number
) {
const m = Math.floor(sec / 60);
const s = sec % 60;

return "${m .toString() .padStart(2, "0")}:${s .toString() .padStart(2, "0")}";
}

export default function Quiz() {
const { user } = useAuth();

const params =
new URLSearchParams(
window.location.search
);

const groupId =
params.get("group");

const [allWords, setAllWords] =
useState<Word[]>([]);

const [groups, setGroups] =
useState<Group[]>([]);

const [loading, setLoading] =
useState(true);

const [started, setStarted] =
useState(false);

const [done, setDone] =
useState(false);

const [score, setScore] =
useState(0);

const [
currentIndex,
setCurrentIndex,
] = useState(0);

const [
elapsedSeconds,
setElapsedSeconds,
] = useState(0);

const [quizMode, setQuizMode] =
useState<QuizMode>(
"multiple-choice"
);

const [
questionCount,
setQuestionCount,
] = useState(20);

const [selected, setSelected] =
useState<string | null>(null);

const [textAnswer, setTextAnswer] =
useState("");

const [
selectedWords,
setSelectedWords,
] = useState<string[]>([]);

const [
multiChecked,
setMultiChecked,
] = useState(false);

const [answers, setAnswers] =
useState<boolean[]>([]);

useEffect(() => {
if (!user) return;

Promise.all([
  listWords(user.uid),
  listGroups(user.uid),
]).then(
  ([words, groups]) => {
    setAllWords(words);
    setGroups(groups);
    setLoading(false);
  }
);

}, [user]);

useEffect(() => {
if (!started || done)
return;

const timer =
  setInterval(() => {
    setElapsedSeconds(
      (s) => s + 1
    );
  }, 1000);

return () =>
  clearInterval(timer);

}, [started, done]);

const filteredWords =
useMemo(() => {
if (!groupId)
return allWords;

  const validGroupIds =
    groups
      .filter(
        (g) =>
          g.id === groupId ||
          g.path?.includes(
            groupId
          )
      )
      .map(
        (g) => g.id
      );

  return allWords.filter(
    (word) =>
      word.groupIds?.some(
        (id) =>
          validGroupIds.includes(
            id
          )
      )
  );
}, [
  allWords,
  groups,
  groupId,
]);
  const questions =
useMemo<QuizQuestion[]>(
() => {
if (
!started ||
filteredWords.length < 4
)
return [];

    const sourceWords =
      shuffle(
        filteredWords
      ).slice(
        0,
        Math.min(
          questionCount,
          filteredWords.length
        )
      );

    return sourceWords.map(
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

        const sameMeaning =
          allWords
            .filter(
              (w) =>
                normalize(
                  w.definition
                ) ===
                normalize(
                  word.definition
                )
            )
            .map(
              (w) =>
                normalize(
                  w.term
                )
            );

        const correctWords =
          [
            ...new Set([
              ...sameMeaning,
              ...(
                word.synonyms ??
                []
              ).map(
                (s) =>
                  normalize(
                    s
                  )
              ),
            ]),
          ];

        const wrongDefs =
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
            );

        const options =
          shuffle([
            word.definition,
            ...shuffle(
              wrongDefs
            ).slice(
              0,
              3
            ),
          ]);

        return {
          wordId:
            word.id,
          term:
            word.term,
          definition:
            word.definition,
          options,
          type,
          correctWords,
        };
      }
    );
  },
  [
    started,
    filteredWords,
    quizMode,
    questionCount,
    allWords,
  ]
);

const currentQ =
questions[
currentIndex
];

const progress =
questions.length > 0
? ((currentIndex +
1) /
questions.length) *
100
: 0;

async function handleSelect(
option: string
) {
if (
!user ||
!currentQ ||
selected !== null
)
return;

const correct =
  option ===
  currentQ.definition;

setSelected(
  option
);

if (correct)
  setScore(
    (s) => s + 1
  );

setAnswers(
  (a) => [
    ...a,
    correct,
  ]
);

await reviewWord(
  user.uid,
  currentQ.wordId,
  correct
);

if (
  currentIndex === 0
) {
  await updateStreak(
    user.uid
  );
}

}

async function handleFillCheck() {
if (
!user ||
!currentQ
)
return;

const entered =
  textAnswer
    .split(",")
    .map(
      (x) =>
        normalize(
          x
        )
    )
    .filter(
      Boolean
    );

const correct =
  currentQ.correctWords;

const ok =
  correct.every(
    (x) =>
      entered.includes(
        x
      )
  ) &&
  entered.every(
    (x) =>
      correct.includes(
        x
      )
  );

setSelected(
  ok
    ? "__correct__"
    : "__wrong__"
);

if (ok)
  setScore(
    (s) => s + 1
  );

setAnswers(
  (a) => [
    ...a,
    ok,
  ]
);

await reviewWord(
  user.uid,
  currentQ.wordId,
  ok
);

}

function toggleWord(
word: string
) {
if (
multiChecked
)
return;

setSelectedWords(
  (prev) =>
    prev.includes(
      word
    )
      ? prev.filter(
          (w) =>
            w !==
            word
        )
      : [
          ...prev,
          word,
        ]
);

}

async function handleMultiCheck() {
if (
!user ||
!currentQ
)
return;

const selectedNormalized =
  selectedWords.map(
    normalize
  );

const correct =
  currentQ.correctWords;

const ok =
  correct.every(
    (x) =>
      selectedNormalized.includes(
        x
      )
  ) &&
  selectedNormalized.every(
    (x) =>
      correct.includes(
        x
      )
  );

if (ok)
  setScore(
    (s) => s + 1
  );

setAnswers(
  (a) => [
    ...a,
    ok,
  ]
);

setMultiChecked(
  true
);

await reviewWord(
  user.uid,
  currentQ.wordId,
  ok
);

}

function handleNext() {
if (
currentIndex + 1 >=
questions.length
) {
setDone(
true
);
return;
}

setCurrentIndex(
  (i) => i + 1
);

setSelected(
  null
);

setTextAnswer(
  ""
);

setSelectedWords(
  []
);

setMultiChecked(
  false
);

}

function restartQuiz() {
setStarted(
false
);
setDone(
false
);
setScore(
0
);
setCurrentIndex(
0
);
setAnswers(
[]
);
setSelected(
null
);
setTextAnswer(
""
);
setSelectedWords(
[]
);
setElapsedSeconds(
0
);
setMultiChecked(
false
);
}

const multiOptions =
useMemo(() => {
if (
!currentQ ||
currentQ.type !==
"multi-select"
)
return [];

  const wrongWords =
    shuffle(
      filteredWords
        .map(
          (w) =>
            w.term
        )
        .filter(
          (t) =>
            !currentQ.correctWords.includes(
              normalize(
                t
              )
            )
        )
    ).slice(
      0,
      7
    );

  return shuffle([
    ...currentQ.correctWords,
    ...wrongWords,
  ]);
}, [
  currentQ,
  filteredWords,
]);
  if (loading) {
return (
<Layout>
<div className="flex items-center justify-center h-64">
Đang tải...
</div>
</Layout>
);
}

if (filteredWords.length < 4) {
return (
<Layout>
<div className="flex flex-col items-center justify-center py-20 space-y-4">
<GraduationCap className="w-16 h-16 text-muted-foreground" />

      <h2 className="text-2xl font-bold">
        Không đủ từ vựng
      </h2>

      <p className="text-muted-foreground">
        Cần ít nhất 4 từ để tạo bài kiểm tra
      </p>

      <Button asChild>
        <Link href="/">
          Quay lại
        </Link>
      </Button>
    </div>
  </Layout>
);

}

if (!started) {
return (
<Layout>
<div className="max-w-lg mx-auto py-12 text-center space-y-6">

      <GraduationCap className="w-16 h-16 mx-auto text-primary" />

      <h1 className="text-3xl font-bold">
        Bài kiểm tra từ vựng
      </h1>

      <div className="space-y-3">

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
            Điền đáp án
          </option>

          <option value="multi-select">
            Chọn nhiều đáp án
          </option>

          <option value="mixed">
            Hỗn hợp
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

      </div>

      <Button
        size="lg"
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

return (
  <Layout>
    <div className="max-w-lg mx-auto py-10 text-center space-y-6">

      <MascotCelebration
        message="Hoàn thành"
        subMessage={`Bạn đạt ${score}/${questions.length}`}
      />

      <div className="text-6xl font-bold text-primary">
        {percent}%
      </div>

      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        {formatTime(
          elapsedSeconds
        )}
      </div>

      <Button
        onClick={
          restartQuiz
        }
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Làm lại
      </Button>

    </div>
  </Layout>
);

}

return (
<Layout>

  <div className="max-w-2xl mx-auto space-y-6">

    <div className="flex justify-between items-center">

      <div>
        <h1 className="font-bold text-2xl">
          Kiểm tra
        </h1>

        <p className="text-muted-foreground">
          Câu {currentIndex + 1}
          /{questions.length}
        </p>
      </div>

      <div className="text-right">

        <div className="font-bold text-green-600">
          {score}
        </div>

        <div className="text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatTime(
            elapsedSeconds
          )}
        </div>

      </div>

    </div>

    <Progress
      value={progress}
    />

    <div className="border rounded-2xl p-8">

      {currentQ?.type ===
        "multiple-choice" && (
        <>

          <h2 className="text-4xl text-center font-bold mb-6">
            {currentQ.term}
          </h2>

          <div className="grid gap-3">

            {currentQ.options.map(
              (
                option,
                i
              ) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start"
                  onClick={() =>
                    handleSelect(
                      option
                    )
                  }
                  disabled={
                    selected !==
                    null
                  }
                >
                  {option}
                </Button>
              )
            )}

          </div>

        </>
      )}

      {currentQ?.type ===
        "fill-all" && (
        <div className="space-y-4">

          <h2 className="text-2xl font-bold">
            {
              currentQ.definition
            }
          </h2>

          <textarea
            className="w-full border rounded-lg p-3"
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

          {selected ===
            null && (
            <Button
              onClick={
                handleFillCheck
              }
            >
              Kiểm tra
            </Button>
          )}

        </div>
      )}

      {currentQ?.type ===
        "multi-select" && (
        <div className="space-y-4">

          <h2 className="text-2xl font-bold">
            {
              currentQ.definition
            }
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {multiOptions.map(
              (
                word
              ) => (
                <Button
                  key={
                    word
                  }
                  variant={
                    selectedWords.includes(
                      word
                    )
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    toggleWord(
                      word
                    )
                  }
                >
                  {word}
                </Button>
              )
            )}

          </div>

          {!multiChecked && (
            <Button
              onClick={
                handleMultiCheck
              }
            >
              Kiểm tra
            </Button>
          )}

        </div>
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
