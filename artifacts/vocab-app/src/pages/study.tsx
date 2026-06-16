import { useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import {
  useGetDueWords,
  useReviewWord,
  getGetDueWordsQueryKey,
  getGetStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw, BookOpen } from "lucide-react";
import { Link } from "wouter";

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i < level ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function Study() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const { data: words, isLoading } = useGetDueWords();
  const reviewWord = useReviewWord();
  const queryClient = useQueryClient();

  const currentWord = words?.[currentIndex];

  const handleFlip = useCallback(() => {
    if (!flipped) setStartTime(Date.now());
    setFlipped((f) => !f);
  }, [flipped]);

  const handleReview = useCallback(
    async (correct: boolean) => {
      if (!currentWord) return;
      const timeSpentMs = startTime ? Date.now() - startTime : undefined;
      await reviewWord.mutateAsync({
        id: currentWord.id,
        data: { correct, timeSpentMs },
      });
      if (correct) setSessionCorrect((c) => c + 1);
      setSessionTotal((t) => t + 1);
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });

      if (currentIndex + 1 >= (words?.length ?? 0)) {
        setDone(true);
        queryClient.invalidateQueries({ queryKey: getGetDueWordsQueryKey() });
      } else {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
        setStartTime(null);
      }
    },
    [currentWord, currentIndex, words, reviewWord, queryClient, startTime]
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading your study session...</div>
        </div>
      </Layout>
    );
  }

  if (!words || words.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-primary" />
          <h2 className="text-2xl font-serif font-bold">All caught up!</h2>
          <p className="text-muted-foreground">No words are due for review right now. Come back later or add new words.</p>
          <div className="flex gap-3">
            <Button asChild variant="outline"><Link href="/words">View Vocabulary</Link></Button>
            <Button asChild><Link href="/words/new">Add a Word</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (done) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold">Session Complete!</h2>
            <p className="text-muted-foreground mt-2">You reviewed {sessionTotal} words</p>
          </div>
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{sessionCorrect}</p>
              <p className="text-sm text-muted-foreground mt-1">Correct</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-muted-foreground">{sessionTotal - sessionCorrect}</p>
              <p className="text-sm text-muted-foreground mt-1">Still learning</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setCurrentIndex(0); setFlipped(false); setDone(false); setSessionCorrect(0); setSessionTotal(0); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Study Again
            </Button>
            <Button asChild><Link href="/">Back to Dashboard</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const progress = ((currentIndex) / words.length) * 100;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold">Study Session</h1>
            <p className="text-sm text-muted-foreground mt-1">{currentIndex + 1} of {words.length} words</p>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">{sessionCorrect} correct</span>
            <span>/</span>
            <span>{sessionTotal} reviewed</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Flashcard */}
        <div
          className="relative h-80 cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={handleFlip}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Click to reveal definition</p>
              <h2 className="text-5xl font-serif font-bold text-foreground text-center">{currentWord?.term}</h2>
              {currentWord?.pronunciation && (
                <p className="text-muted-foreground font-mono mt-3">{currentWord.pronunciation}</p>
              )}
              <div className="flex gap-2 mt-4">
                {currentWord?.partOfSpeech && <Badge variant="secondary">{currentWord.partOfSpeech}</Badge>}
                {currentWord?.difficulty && (
                  <Badge variant={currentWord.difficulty === "hard" ? "destructive" : "outline"}>
                    {currentWord.difficulty}
                  </Badge>
                )}
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col justify-center shadow-lg"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <p className="text-xs uppercase tracking-widest text-primary-foreground/60 mb-4">Definition</p>
              <p className="text-xl leading-relaxed font-medium">{currentWord?.definition}</p>
              {currentWord?.example && (
                <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                  <p className="text-sm text-primary-foreground/70 italic">"{currentWord.example}"</p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-primary-foreground/60">Mastery</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < (currentWord?.masteryLevel ?? 0) ? "bg-primary-foreground" : "bg-primary-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleReview(false)}
              disabled={reviewWord.isPending}
            >
              <XCircle className="w-5 h-5 mr-2" /> Still Learning
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleReview(true)}
              disabled={reviewWord.isPending}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Got It
            </Button>
          </div>
        )}

        {!flipped && (
          <p className="text-center text-sm text-muted-foreground">Tap the card to flip it</p>
        )}
      </div>
    </Layout>
  );
}
