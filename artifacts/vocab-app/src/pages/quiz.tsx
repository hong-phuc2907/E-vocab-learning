import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
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
import { GraduationCap, Clock, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { MascotCelebration } from "@/components/mascot-celebration";

// --- Helpers ---
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

export default function Quiz() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [multiChecked, setMultiChecked] = useState(false);

  // Filters
  const [quizMode, setQuizMode] = useState<QuizMode>("multiple-choice");
  const [questionCount, setQuestionCount] = useState(10);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedGroup, setSelectedGroup] = useState("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([listWords(user.uid), listGroups(user.uid)]).then(([words, grps]) => {
      setAllWords(words);
      setGroups(grps);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("group");
    if (groupId) setSelectedGroup(groupId);
  }, [location]);

  const filteredWords = useMemo(() => {
    let words = [...allWords];
    if (selectedGroup !== "all") {
      const groupIds = groups.filter(g => g.id === selectedGroup || g.path?.includes(selectedGroup)).map(g => g.id);
      words = words.filter(w => w.groupIds?.some(id => groupIds.includes(id)));
    }
    if (dateFilter !== "all") {
      const now = new Date();
      words = words.filter(w => {
        if (!w.createdAt) return true;
        const diffDays = Math.floor((now.getTime() - new Date(w.createdAt).getTime()) / 86400000);
        if (dateFilter === "today") return diffDays === 0;
        if (dateFilter === "yesterday") return diffDays === 1;
        if (dateFilter === "3days") return diffDays <= 3;
        if (dateFilter === "7days") return diffDays <= 7;
        return true;
      });
    }
    return words;
  }, [allWords, groups, selectedGroup, dateFilter]);

  const questions = useMemo<QuizQuestion[]>(() => {
    if (!started || filteredWords.length < 4) return [];
    return shuffle(filteredWords).slice(0, Math.min(questionCount, filteredWords.length)).map(word => ({
      wordId: word.id,
      term: word.term,
      correctDefinition: word.definition,
      type: quizMode === "mixed" ? (["multiple-choice", "fill-all", "multi-select"] as const)[Math.floor(Math.random() * 3)] : quizMode,
      correctWords: [word.term.toLowerCase().trim(), ...(word.synonyms ?? []).map(s => s.toLowerCase().trim())],
      options: shuffle([word.definition, ...shuffle(allWords.filter(w => w.id !== word.id).map(w => w.definition)).slice(0, 3)])
    }));
  }, [filteredWords, started, quizMode, questionCount, allWords]);

  const currentQ = questions[currentIndex];

  // Handlers (xử lý logic trả lời)
  const handleSelect = async (option: string) => {
    if (selected !== null || !user) return;
    setSelected(option);
    const isCorrect = option === currentQ.correctDefinition;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(a => [...a, isCorrect]);
    await reviewWord(user.uid, currentQ.wordId, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) setDone(true);
    else {
      setCurrentIndex(i => i + 1);
      setSelected(null);
    }
  };

  if (isLoading) return <Layout><div className="p-8 text-center">Đang tải...</div></Layout>;

  if (!started) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-12 space-y-4">
          <h1 className="text-2xl font-bold text-center">Bắt đầu Quiz</h1>
          <select className="w-full border p-2" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">Tất cả nhóm</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button className="w-full" onClick={() => setStarted(true)}>Bắt đầu</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Progress value={(currentIndex / questions.length) * 100} />
        <h2 className="text-2xl font-bold text-center">{currentQ.term}</h2>
        <div className="grid gap-2">
          {currentQ.options.map(op => (
            <Button key={op} variant={selected === op ? (op === currentQ.correctDefinition ? "default" : "destructive") : "outline"} onClick={() => handleSelect(op)}>
              {op}
            </Button>
          ))}
        </div>
        {selected && <Button className="w-full" onClick={handleNext}>Tiếp theo</Button>}
      </div>
    </Layout>
  );
}
