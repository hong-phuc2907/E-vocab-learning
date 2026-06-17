import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { listWords, deleteWord as fsDeleteWord, type Word } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Search, BookOpen } from "lucide-react";
import { Link } from "wouter";

const DIFF_LABELS: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const  POS_LABELS: Record<string,string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  pronoun: "Đại từ",
  interjection: "Thán từ",

  phrase: "Cụm từ",
  idiom: "Thành ngữ",
  collocation: "Collocation",
  expression: "Expression",
  "phrasal-verb": "Phrasal Verb",
  "compound-word": "Từ ghép",
};

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${i < level ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}

export default function Words() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const ws = await listWords(user.uid, {
      search: debouncedSearch || undefined,
      difficulty: difficulty === "all" ? undefined : difficulty,
    });
    setWords(ws);
    setIsLoading(false);
  }, [user, debouncedSearch, difficulty]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimeout);
    (window as any)._searchTimeout = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Xóa từ này khỏi bộ sưu tập?")) return;
    await fsDeleteWord(user.uid, id);
    load();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Từ vựng</h1>
            <p className="text-muted-foreground mt-1">
              {words ? `${words.length} từ` : ""}
            </p>
          </div>
          <Button asChild>
            <Link href="/words/new">
              <Plus className="w-4 h-4 mr-2" /> Thêm từ
            </Link>
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm từ hoặc nghĩa..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold">Không tìm thấy từ nào</h3>
            <p className="text-muted-foreground">
              {debouncedSearch || difficulty !== "all"
                ? "Thử điều chỉnh bộ lọc"
                : "Bộ sưu tập trống. Thêm từ đầu tiên để bắt đầu."}
            </p>
            {!debouncedSearch && difficulty === "all" && (
              <Button asChild>
                <Link href="/words/new">Thêm từ đầu tiên</Link>
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
                        <span className="text-xs text-muted-foreground italic">{POS_LABELS[word.partOfSpeech] ?? word.partOfSpeech}</span>
                      )}
                      {word.difficulty && (
                        <Badge variant={word.difficulty === "hard" ? "destructive" : word.difficulty === "easy" ? "secondary" : "outline"} className="text-xs">
                          {DIFF_LABELS[word.difficulty] ?? word.difficulty}
                        </Badge>
                      )}
                      {word.category && <Badge variant="outline" className="text-xs">{word.category}</Badge>}
                      {word.masteryLevel >= 5 && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Thành thạo</Badge>
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
