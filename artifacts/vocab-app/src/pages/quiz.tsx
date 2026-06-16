import { useState, useMemo } from "react";
import { Layout } from "@/components/layout";
import { useListWords, useReviewWord, getGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, GraduationCap } from "lucide-react";
import { Link } from "wouter";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion {
  wordId: number;
  term: string;
  correctDefinition: string;
  options: string[];
}

export default function Quiz() {
  const { data: allWords, isLoading } = useListWords();
  const reviewWord = useReviewWord();
  const queryClient = useQueryClient();

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const questions = useMemo<QuizQuestion[]>(() => {
    if (!allWords || allWords.length < 2) return [];
    const pool = shuffle(allWords).slice(0, 10);
    return pool.map((word) => {
      const distractors = shuffle(allWords.filter((w) => w.id !== word.id))
        .slice(0, 3)
        .map((w) => w.definition);
      const options = shuffle([word.definition, ...distractors]);
      return {
        wordId: word.id,
        term: word.term,
        correctDefinition: word.definition,
        options,
      };
    });
  }, [allWords, started]);

  const currentQ = questions[currentIndex];
  const isCorrect = selected === currentQ?.correctDefinition;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const handleSelect = async (option: string) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === currentQ.correctDefinition;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, correct]);
    await reviewWord.mutateAsync({
      id: currentQ.wordId,
      data: { correct },
    });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setAnswers([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Preparing your quiz...</div>
        </div>
      </Layout>
    );
  }

  if (!allWords || allWords.length < 4) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <GraduationCap className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-serif font-bold">Not enough words</h2>
          <p className="text-muted-foreground">You need at least 4 words in your collection to take a quiz.</p>
          <Button asChild><Link href="/words/new">Add Words</Link></Button>
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
            <h1 className="text-3xl font-serif font-bold">Vocabulary Quiz</h1>
            <p className="text-muted-foreground mt-2">
              Test yourself on {Math.min(10, allWords.length)} randomly selected words.
              Choose the correct definition for each word.
            </p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{Math.min(10, allWords.length)}</p>
              <p>Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">4</p>
              <p>Options each</p>
            </div>
          </div>
          <Button size="lg" className="w-full max-w-xs" onClick={() => setStarted(true)}>
            Start Quiz
          </Button>
        </div>
      </Layout>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? "Excellent" : pct >= 70 ? "Good work" : pct >= 50 ? "Keep practicing" : "Needs work";
    return (
      <Layout>
        <div className="max-w-lg mx-auto flex flex-col items-center py-12 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold">{grade}!</h2>
            <p className="text-muted-foreground mt-2">You scored {score} out of {questions.length}</p>
          </div>
          <div className="text-5xl font-bold text-primary">{pct}%</div>
          <div className="flex gap-2 flex-wrap justify-center">
            {answers.map((correct, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRestart}>
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button asChild><Link href="/">Dashboard</Link></Button>
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
            <h1 className="text-2xl font-serif font-bold">Quiz</h1>
            <p className="text-sm text-muted-foreground mt-1">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="text-sm font-medium">
            <span className="text-green-600">{score}</span>
            <span className="text-muted-foreground"> / {currentIndex}</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="bg-card border border-card-border rounded-2xl p-8 text-center shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">What does this mean?</p>
          <h2 className="text-4xl font-serif font-bold">{currentQ.term}</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentQ.options.map((option, i) => {
            const isSelected = selected === option;
            const correct = option === currentQ.correctDefinition;
            let cls = "w-full text-left p-4 rounded-xl border-2 transition-all text-sm leading-relaxed ";

            if (selected !== null) {
              if (correct) cls += "border-green-500 bg-green-50 text-green-800";
              else if (isSelected && !correct) cls += "border-red-400 bg-red-50 text-red-800";
              else cls += "border-border bg-card text-muted-foreground opacity-60";
            } else {
              cls += "border-border bg-card hover:border-primary hover:shadow-sm cursor-pointer";
            }

            return (
              <button key={i} className={cls} onClick={() => handleSelect(option)} disabled={selected !== null}>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{option}</span>
                  {selected !== null && correct && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0 mt-0.5" />}
                  {isSelected && !correct && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0 mt-0.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`rounded-xl p-4 mb-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <p className={`font-medium ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                {isCorrect ? "Correct!" : "Not quite."}
              </p>
              {!isCorrect && (
                <p className="text-sm text-muted-foreground mt-1">
                  The correct answer is: <span className="font-medium text-foreground">{currentQ.correctDefinition}</span>
                </p>
              )}
            </div>
            <Button size="lg" className="w-full" onClick={handleNext}>
              {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
