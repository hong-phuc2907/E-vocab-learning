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
  RefreshCw,
  GraduationCap,
  Clock,
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

type QuizMode = "multiple-choice" | "fill-all" | "multi-select" | "mixed";
type DateFilter = "all" | "today" | "yesterday" | "3days" | "7days";

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
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("multiple-choice");
  const [questionCount, setQuestionCount] = useState(10);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [multiChecked, setMultiChecked] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!user) return;
    listWords(user.uid).then((words) => {
      setAllWords(words);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!started || done) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, done]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const filteredWords = useMemo(() => {
    if (dateFilter === "all") return allWords;
    const now = new Date();
    return allWords.filter((word) => {
      if (!word.createdAt) return true;
      const created = new Date(word.createdAt);
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      switch (dateFilter) {
        case "today": return diffDays === 0;
        case "yesterday": return diffDays === 1;
        case "3days": return diffDays <= 3;
        case "7days": return diffDays <= 7;
        default: return true;
      }
    });
  }, [allWords, dateFilter]);

  const questions = useMemo<QuizQuestion[]>(() => {
    if (!started || filteredWords.length < 4) return [];
    const uniqueWords = shuffle([...filteredWords]).slice(0, Math.min(questionCount, filteredWords.length));

    return uniqueWords.map((word) => {
      let type: QuizMode = quizMode;
      if (quizMode === "mixed") {
        const modes: QuizMode[] = ["multiple-choice", "fill-all", "multi-select"];
        type = modes[Math.floor(Math.random() * modes.length)];
      }

      const sameMeaningWords = allWords
        .filter((w) => w.definition.toLowerCase().trim() === word.definition.toLowerCase().trim())
        .map((w) => w.term.toLowerCase().trim());

      const correctWords = [...new Set([...sameMeaningWords, ...(word.synonyms ?? []).map((s) => s.toLowerCase().trim())])];
      const uniqueDefinitions = [...new Set(filteredWords.filter((w) => w.id !== word.id && w.definition !== word.definition).map((w) => w.definition))];
      const distractors = shuffle(uniqueDefinitions).slice(0, 3);
      let options = shuffle([word.definition, ...distractors]);
      options = [...new Set(options)];

      while (options.length < 4) {
        const extra = filteredWords[Math.floor(Math.random() * filteredWords.length)]?.definition;
        if (extra && !options.includes(extra)) options.push(extra);
      }

      return {
        wordId: word.id,
        term: word.term,
        correctDefinition: word.definition,
        options: shuffle(options),
        type,
        correctWords,
      };
    });
  }, [filteredWords, started, quizMode, questionCount, allWords]);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const handleSelect = async (option: string) => {
    if (selected !== null || !user || !currentQ) return;
    setSelected(option);
    const correct = option === currentQ.correctDefinition;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, correct]);
    setIsPending(true);
    await reviewWord(user.uid, currentQ.wordId, correct);
    if (currentIndex === 0) updateStreak(user.uid);
    setIsPending(false);
  };

  const handleFillAllCheck = async () => {
    if (!user || !currentQ) return;
    const entered = textAnswer.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
    const correct = currentQ.correctWords.map((x) => x.toLowerCase());
    const isAllCorrect = correct.length === entered.length && correct.every(x => entered.includes(x));
    setSelected(isAllCorrect ? "__correct__" : "__wrong__");
    if (isAllCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, isAllCorrect]);
    await reviewWord(user.uid, currentQ.wordId, isAllCorrect);
  };

  const toggleMultiWord = (word: string) => {
    if (multiChecked) return;
    setSelectedWords((prev) => prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]);
  };

  const handleMultiCheck = async () => {
    if (!currentQ || !user) return;
    const correctWords = currentQ.correctWords.map(normalizeAnswer);
    const selectedNormalized = selectedWords.map(normalizeAnswer);
    const allCorrect = correctWords.every((w) => selectedNormalized.includes(w)) && selectedNormalized.every((w) => correctWords.includes(w));
    if (allCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, allCorrect]);
    setMultiChecked(true);
    await reviewWord(user.uid, currentQ.wordId, allCorrect);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) { setDone(true); return; }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setTextAnswer("");
    setSelectedWords([]);
    setMultiChecked(false);
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setAnswers([]);
    setTextAnswer("");
    setSelectedWords([]);
    setMultiChecked(false);
    setElapsedSeconds(0);
  };

  const multiOptions = useMemo(() => {
    if (!currentQ || currentQ.type !== "multi-select") return [];
    const correct = currentQ.correctWords;
    const wrong = shuffle(filteredWords.filter((w) => !correct.includes(w.term)).map((w) => w.term)).slice(0, 7);
    return shuffle([...correct, ...wrong]).slice(0, 10);
  }, [currentQ, filteredWords]);

  if (isLoading) return <Layout><div className="flex items-center justify-center h-64 text-muted-foreground">Đang chuẩn bị...</div></Layout>;

  if (filteredWords.length < 4) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <GraduationCap className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Không đủ từ</h2>
        <p className="text-muted-foreground">Hãy thêm ít nhất 4 từ để bắt đầu.</p>
      </div>
    </Layout>
  );

  if (!started) return (
    <Layout>
      <div className="max-w-md mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold text-center">Bắt đầu Quiz</h1>
        <div className="space-y-4">
          <select className="w-full border rounded-lg p-2" value={quizMode} onChange={(e) => setQuizMode(e.target.value as QuizMode)}>
            <option value="multiple-choice">Trắc nghiệm</option>
            <option value="fill-all">Điền từ</option>
            <option value="multi-select">Chọn từ đúng</option>
            <option value="mixed">Kết hợp</option>
          </select>
          <Button className="w-full" onClick={() => setStarted(true)}>Bắt đầu</Button>
        </div>
      </div>
    </Layout>
  );

  if (done) return (
    <Layout>
      <div className="max-w-lg mx-auto py-10 text-center space-y-6">
        <MascotCelebration message={score / questions.length > 0.5 ? "Chúc mừng!" : "Cần luyện thêm"} subMessage={`Bạn đạt ${score}/${questions.length}`} />
        <div className="text-4xl font-bold">{Math.round((score / questions.length) * 100)}%</div>
        <div className="flex justify-center gap-2">
          {answers.map((cor, i) => <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${cor ? "bg-green-100" : "bg-red-100"}`}>{i + 1}</div>)}
        </div>
        <Button onClick={handleRestart}><RefreshCw className="w-4 h-4 mr-2" />Làm lại</Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <Progress value={progress} />
        <h2 className="text-2xl font-bold text-center">{currentQ?.term}</h2>
        
        {/* Render UI dựa theo currentQ.type (multiple-choice, fill-all, multi-select) */}
        {currentQ?.type === "multiple-choice" && (
          <div className="grid gap-2">
            {currentQ.options.map(op => (
              <Button key={op} variant={selected === op ? (op === currentQ.correctDefinition ? "default" : "destructive") : "outline"} onClick={() => handleSelect(op)} disabled={selected !== null}>
                {op}
              </Button>
            ))}
          </div>
        )}
        
        {selected !== null && <Button className="w-full" onClick={handleNext}>Tiếp theo</Button>}
      </div>
    </Layout>
  );
}
