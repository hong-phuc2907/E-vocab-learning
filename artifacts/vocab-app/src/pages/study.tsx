'use client'; // Thêm dòng này nếu bạn dùng Next.js App Router, nếu dùng Vite thì bỏ qua

import { useState, useCallback, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { getDueWords, reviewWord, updateStreak, type Word } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { MascotCelebration } from "@/components/mascot-celebration";

const DIFF_LABELS: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const POS_LABELS: Record<string, string> = {
  noun: "Danh từ", verb: "Động từ", adjective: "Tính từ", adverb: "Trạng từ",
  preposition: "Giới từ", conjunction: "Liên từ", pronoun: "Đại từ",
  interjection: "Thán từ", phrase: "Cụm từ",
};

export default function Study() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const ws = await getDueWords(user.uid);
      setWords(ws || []);
    } catch (error) {
      console.error("Lỗi tải từ vựng:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const currentWord = words[currentIndex];

  const handleFlip = useCallback(() => {
    if (!flipped) setStartTime(Date.now());
    setFlipped((f) => !f);
  }, [flipped]);

  const handleReview = useCallback(async (correct: boolean) => {
    if (!currentWord || !user || isPending || isTransitioning) return;
    setIsPending(true);
    
    try {
      await reviewWord(user.uid, currentWord.id, correct);
      if (sessionTotal === 0) updateStreak(user.uid);
      if (correct) setSessionCorrect((c) => c + 1);
      setSessionTotal((t) => t + 1);

      if (currentIndex + 1 >= words.length) {
        setDone(true);
      } else {
        setIsTransitioning(true);
        setSlideDirection(correct ? "left" : "right");

        setTimeout(() => {
          setCurrentIndex((i) => i + 1);
          setFlipped(false);
          setStartTime(null);
          setSlideDirection(correct ? "right" : "left");
        }, 200);

        setTimeout(() => {
          setIsTransitioning(false);
        }, 260);
      }
    } catch (error) {
      console.error("Lỗi lưu kết quả ôn tập:", error);
    } finally {
      setIsPending(false);
    }
  }, [currentWord, currentIndex, words.length, user, sessionTotal, isPending, isTransitioning]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Đang tải bài học...</div>
        </div>
      </Layout>
    );
  }

  if (!words || words.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-primary" />
          <h2 className="text-2xl font-serif font-bold">Bạn đã hoàn thành tất cả!</h2>
          <p className="text-muted-foreground">Không có từ nào cần ôn tập lúc này. Quay lại sau hoặc thêm từ mới.</p>
          <div className="flex gap-3">
            <Button asChild variant="outline"><Link href="/words">Xem từ vựng</Link></Button>
            <Button asChild><Link href="/words/new">Thêm từ mới</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (done) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    const celebMsg = accuracy >= 90 ? "Xuất sắc! 🏆" : accuracy >= 70 ? "Làm tốt lắm! 🎉" : "Cố gắng lên! 💪";
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <MascotCelebration
            message={celebMsg}
            subMessage={`Bạn đã ôn tập ${sessionTotal} từ trong buổi học này`}
          />

          <div className="flex gap-6 text-center bg-card border border-border rounded-2xl px-10 py-5">
            <div>
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted-foreground mt-1">Độ chính xác</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-4xl font-bold text-green-600">{sessionCorrect}</p>
              <p className="text-sm text-muted-foreground mt-1">Đúng</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-4xl font-bold text-muted-foreground">{sessionTotal - sessionCorrect}</p>
              <p className="text-sm text-muted-foreground mt-1">Cần học thêm</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { load(); setCurrentIndex(0); setFlipped(false); setDone(false); setSessionCorrect(0); setSessionTotal(0); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Học lại
            </Button>
            <Button asChild><Link href="/">Về tổng quan</Link></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const progress = (currentIndex / words.length) * 100;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold">Buổi học</h1>
            <p className="text-sm text-muted-foreground mt-1">{currentIndex + 1} / {words.length} từ</p>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">{sessionCorrect} đúng</span>
            <span>/</span>
            <span>{sessionTotal} đã ôn</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div 
          className={`transition-all duration-300 ease-out transform-gpu
            ${isTransitioning 
              ? (slideDirection === "left" ? "-translate-x-24 opacity-0 -rotate-2" : "translate-x-24 opacity-0 rotate-2")
              : "translate-x-0 opacity-100 rotate-0"
            }`}
        >
          <div 
            className="relative h-80 cursor-pointer" 
            style={{ perspective: "1000px" }} 
            onClick={() => { if (!isTransitioning) handleFlip(); }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              <div
                className="absolute inset-0 bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Nhấp để xem nghĩa</p>
                <h2 className="text-5xl font-serif font-bold text-foreground text-center">{currentWord?.term}</h2>
                {currentWord?.pronunciation && <p className="text-muted-foreground font-mono mt-3">{currentWord.pronunciation}</p>}
                <div className="flex gap-2 mt-4">
                  {currentWord?.partOfSpeech && <Badge variant="secondary">{POS_LABELS[currentWord.partOfSpeech] ?? currentWord.partOfSpeech}</Badge>}
                  {currentWord?.difficulty && (
                    <Badge variant={currentWord.difficulty === "hard" ? "destructive" : "outline"}>
                      {DIFF_LABELS[currentWord.difficulty] ?? currentWord.difficulty}
                    </Badge>
                  )}
                </div>
              </div>

              <div
                className="absolute inset-0 bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col justify-center shadow-lg"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-xs uppercase tracking-widest text-primary-foreground/60 mb-4">Nghĩa</p>
                <p className="text-xl leading-relaxed font-medium">{currentWord?.definition}</p>
                {currentWord?.example && (
                  <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                    <p className="text-sm text-primary-foreground/70 italic">"{currentWord.example}"</p>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-primary-foreground/60">Độ thành thạo</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < (currentWord?.masteryLevel ?? 0) ? "bg-primary-foreground" : "bg-primary-foreground/30"}`} />
                    ))}
                  </div>
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
              disabled={isPending || isTransitioning}
            >
              <XCircle className="w-5 h-5 mr-2" /> Chưa nhớ
            </Button>
            <Button 
              size="lg" 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={() => handleReview(true)} 
              disabled={isPending || isTransitioning}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Đã nhớ
            </Button>
          </div>
        )}

        {!flipped && <p className="text-center text-sm text-muted-foreground">Nhấp vào thẻ để lật</p>}
      </div>
    </Layout>
  );
}
