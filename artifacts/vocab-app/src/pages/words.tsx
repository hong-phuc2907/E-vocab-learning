import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListWords, useDeleteWord, getListWordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Search, BookOpen } from "lucide-react";
import { Link } from "wouter";

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < level ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

export default function Words() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const queryClient = useQueryClient();
  const { data: words, isLoading } = useListWords(
    {
      search: debouncedSearch || undefined,
      difficulty: difficulty === "all" ? undefined : difficulty,
    },
    { query: { queryKey: getListWordsQueryKey({ search: debouncedSearch || undefined, difficulty: difficulty === "all" ? undefined : difficulty }) } }
  );

  const deleteWord = useDeleteWord();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimeout);
    (window as any)._searchTimeout = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this word from your collection?")) return;
    await deleteWord.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListWordsQueryKey() });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Vocabulary</h1>
            <p className="text-muted-foreground mt-1">
              {words ? `${words.length} word${words.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <Button asChild>
            <Link href="/words/new">
              <Plus className="w-4 h-4 mr-2" /> Add Word
            </Link>
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search words or definitions..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !words || words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold">No words found</h3>
            <p className="text-muted-foreground">
              {debouncedSearch || difficulty !== "all"
                ? "Try adjusting your filters"
                : "Your word collection is empty. Add your first word to begin."}
            </p>
            {!debouncedSearch && difficulty === "all" && (
              <Button asChild>
                <Link href="/words/new">Add Your First Word</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {words.map((word) => (
              <Card key={word.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <Link href={`/words/${word.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-serif font-semibold text-foreground">{word.term}</h3>
                      {word.partOfSpeech && (
                        <span className="text-xs text-muted-foreground italic">{word.partOfSpeech}</span>
                      )}
                      {word.difficulty && (
                        <Badge
                          variant={word.difficulty === "hard" ? "destructive" : word.difficulty === "easy" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {word.difficulty}
                        </Badge>
                      )}
                      {word.category && (
                        <Badge variant="outline" className="text-xs">{word.category}</Badge>
                      )}
                      {word.masteryLevel >= 5 && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Mastered</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1 truncate">{word.definition}</p>
                    <div className="mt-2">
                      <MasteryDots level={word.masteryLevel} />
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(word.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
