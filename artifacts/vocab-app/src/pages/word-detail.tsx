import { Layout } from "@/components/layout";
import { useGetWord, useDeleteWord, getGetWordQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Edit, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";

function MasteryBar({ level }: { level: number }) {
  const labels = ["Unseen", "Beginner", "Familiar", "Learning", "Confident", "Mastered"];
  const colors = ["bg-muted", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Mastery</span>
        <span className="font-medium">{labels[Math.min(level, 5)]}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 flex-1 rounded-full transition-all ${
              i < level ? colors[level] : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function WordDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: word, isLoading } = useGetWord(id, {
    query: { queryKey: getGetWordQueryKey(id) },
  });
  const deleteWord = useDeleteWord();

  const handleDelete = async () => {
    if (!confirm("Remove this word from your collection?")) return;
    await deleteWord.mutateAsync({ id });
    navigate("/words");
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-serif font-bold">Word not found</h2>
          <Button asChild variant="outline"><Link href="/words">Back to Vocabulary</Link></Button>
        </div>
      </Layout>
    );
  }

  const accuracy = word.reviewCount > 0
    ? Math.round((word.correctCount / word.reviewCount) * 100)
    : null;

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/words"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Remove
          </Button>
        </div>

        <Card className="border-2 border-card-border">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-4xl font-serif font-bold">{word.term}</h1>
                  {word.pronunciation && (
                    <p className="text-muted-foreground font-mono mt-1">{word.pronunciation}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {word.partOfSpeech && <Badge variant="secondary">{word.partOfSpeech}</Badge>}
                  {word.difficulty && (
                    <Badge variant={word.difficulty === "hard" ? "destructive" : "outline"}>
                      {word.difficulty}
                    </Badge>
                  )}
                  {word.category && <Badge variant="outline">{word.category}</Badge>}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Definition</p>
                <p className="text-lg leading-relaxed">{word.definition}</p>
              </div>

              {word.example && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Example</p>
                  <p className="italic text-foreground">"{word.example}"</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MasteryBar level={word.masteryLevel} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{word.reviewCount}</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{word.correctCount}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{accuracy !== null ? `${accuracy}%` : "—"}</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
            {word.lastReviewedAt && (
              <p className="text-sm text-muted-foreground">
                Last reviewed: {new Date(word.lastReviewedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Button asChild className="w-full">
          <Link href="/study">Study This Word</Link>
        </Button>
      </div>
    </Layout>
  );
}
