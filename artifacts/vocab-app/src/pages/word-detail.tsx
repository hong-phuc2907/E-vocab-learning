import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { getWord, deleteWord as fsDeleteWord, type Word } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
<Button asChild>
  <Link href={`/words/${word.id}/edit`}>
    Chỉnh sửa
  </Link>
</Button>
const DIFF_LABELS: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const POS_LABELS: Record<string, string> = {
  noun: "Danh từ", verb: "Động từ", adjective: "Tính từ", adverb: "Trạng từ",
  preposition: "Giới từ", conjunction: "Liên từ", pronoun: "Đại từ",
  interjection: "Thán từ", phrase: "Cụm từ",
};
const MASTERY_LABELS = ["Chưa học", "Mới biết", "Quen thuộc", "Đang học", "Tự tin", "Thành thạo"];
const MASTERY_COLORS = ["bg-muted", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

function MasteryBar({ level }: { level: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Độ thành thạo</span>
        <span className="font-medium">{MASTERY_LABELS[Math.min(level, 5)]}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-3 flex-1 rounded-full transition-all ${i < level ? MASTERY_COLORS[level] : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export default function WordDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [word, setWord] = useState<Word | null | undefined>(undefined);

  useEffect(() => {
    if (!user || !id) return;
    getWord(user.uid, id).then(setWord);
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !word || !confirm("Xóa từ này khỏi bộ sưu tập?")) return;
    await fsDeleteWord(user.uid, word.id);
    navigate("/words");
  };

  if (word === undefined) {
    return (
      <Layout>
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!word) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <BookOpen className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-2xl font-serif font-bold">Không tìm thấy từ</h2>
          <Button asChild variant="outline"><Link href="/words">Quay lại từ vựng</Link></Button>
        </div>
      </Layout>
    );
  }

  const accuracy = word.reviewCount > 0 ? Math.round((word.correctCount / word.reviewCount) * 100) : null;

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/words"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Xóa
          </Button>
        </div>

        <Card className="border-2 border-card-border">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-4xl font-serif font-bold">{word.term}</h1>
                  {word.pronunciation && <p className="text-muted-foreground font-mono mt-1">{word.pronunciation}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {word.partOfSpeech && <Badge variant="secondary">{POS_LABELS[word.partOfSpeech] ?? word.partOfSpeech}</Badge>}
                  {word.difficulty && (
                    <Badge variant={word.difficulty === "hard" ? "destructive" : "outline"}>
                      {DIFF_LABELS[word.difficulty] ?? word.difficulty}
                    </Badge>
                  )}
                  {word.category && <Badge variant="outline">{word.category}</Badge>}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Nghĩa</p>
                <p className="text-lg leading-relaxed">{word.definition}</p>
              </div>

              {word.example && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Ví dụ</p>
                  <p className="italic text-foreground">"{word.example}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Tiến độ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MasteryBar level={word.masteryLevel} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{word.reviewCount}</p>
                <p className="text-sm text-muted-foreground">Lần ôn tập</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{word.correctCount}</p>
                <p className="text-sm text-muted-foreground">Đúng</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{accuracy !== null ? `${accuracy}%` : "—"}</p>
                <p className="text-sm text-muted-foreground">Chính xác</p>
              </div>
            </div>
            {word.lastReviewedAt && (
              <p className="text-sm text-muted-foreground">
                Ôn lần cuối: {new Date(word.lastReviewedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </CardContent>
        </Card>

        <Button asChild className="w-full">
          <Link href="/study">Học từ này</Link>
        </Button>
      </div>
    </Layout>
  );
}
