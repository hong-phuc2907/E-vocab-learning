import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { createWord, findDuplicate, type Word } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { listWords } from "@/lib/firestore";

export default function WordNew() {
  useEffect(() => {
  if (!user) return;

  listWords(user.uid).then(setAllWords);
}, [user]);
  const handleCopyWord = (wordId: string) => {

  const source = allWords.find(
    w => w.id === wordId
  );

  if (!source) return;

  setForm(f => ({
    ...f,

    definition:
      source.definition,

    example:
      source.example || "",

    pronunciation:
      source.pronunciation || "",

    partOfSpeech:
      source.partOfSpeech || "",

    category:
      source.category || "",

    difficulty:
      source.difficulty || "medium"
  }));
};
  const [allWords, setAllWords] = useState<Word[]>([]);
const [copyWordId, setCopyWordId] = useState("");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isPending, setIsPending] = useState(false);

  const [form, setForm] = useState({
    term: "",
    definition: "",
    partOfSpeech: "",
    example: "",
    pronunciation: "",
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicate, setDuplicate] = useState<Word | null>(null);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicate(null);
    const newErrors: Record<string, string> = {};
    if (!form.term.trim()) newErrors.term = "Vui lòng nhập từ";
    if (!form.definition.trim()) newErrors.definition = "Vui lòng nhập nghĩa";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (!user) return;

    setIsPending(true);

    const input: Record<string, string> = {
      term: form.term.trim(),
      definition: form.definition.trim(),
      difficulty: form.difficulty,
    };
    
    if (form.partOfSpeech) input.partOfSpeech = form.partOfSpeech;
    if (form.example) input.example = form.example;
    if (form.pronunciation) input.pronunciation = form.pronunciation;
    if (form.category) input.category = form.category;

    const dup = await findDuplicate(user.uid, input as any);
    if (dup) {
      setDuplicate(dup);
      setIsPending(false);
      return;
    }

    await createWord(user.uid, input as any);
    setIsPending(false);
    navigate("/words");
  };

  return (
    <Layout>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/words"><ArrowLeft className="w-4 h-4 mr-2" /> Quay lại</Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-serif font-bold">Thêm từ mới</h1>
          <p className="text-muted-foreground mt-1">Mở rộng vốn từ vựng của bạn từng từ một.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="term">Từ hoặc cụm từ <span className="text-destructive">*</span></Label>
                <Input
                  id="term"
                  value={form.term}
                  onChange={(e) => set("term")(e.target.value)}
                  placeholder="VD: ephemeral"
                  className={errors.term ? "border-destructive" : ""}
                />
                {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronunciation">Phiên âm</Label>
                <Input
                  id="pronunciation"
                  value={form.pronunciation}
                  onChange={(e) => set("pronunciation")(e.target.value)}
                  placeholder="VD: /ɪˈfem.ər.əl/"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="definition">Nghĩa <span className="text-destructive">*</span></Label>
                <Textarea
                  id="definition"
                  value={form.definition}
                  onChange={(e) => set("definition")(e.target.value)}
                  placeholder="Từ này có nghĩa là gì?"
                  rows={3}
                  className={errors.definition ? "border-destructive" : ""}
                />
                {errors.definition && <p className="text-xs text-destructive">{errors.definition}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="example">Câu ví dụ</Label>
                <Textarea
                  id="example"
                  value={form.example}
                  onChange={(e) => set("example")(e.target.value)}
                  placeholder="Dùng từ trong một câu..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Từ loại</Label>
                  <Select value={form.partOfSpeech} onValueChange={set("partOfSpeech")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Danh từ</SelectItem>
                      <SelectItem value="verb">Động từ</SelectItem>
                      <SelectItem value="adjective">Tính từ</SelectItem>
                      <SelectItem value="adverb">Trạng từ</SelectItem>
                      <SelectItem value="preposition">Giới từ</SelectItem>
                      <SelectItem value="conjunction">Liên từ</SelectItem>
                      <SelectItem value="pronoun">Đại từ</SelectItem>
                      <SelectItem value="interjection">Thán từ</SelectItem>
                      <SelectItem value="phrase">Cụm từ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Độ khó</Label>
                  <Select value={form.difficulty} onValueChange={(v) => set("difficulty")(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="hard">Khó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Danh mục / Chủ đề</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category")(e.target.value)}
                  placeholder="VD: Luyện thi, Khoa học, Giao tiếp hàng ngày..."
                />
              </div>
            </CardContent>
          </Card>

          {duplicate && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Từ này đã tồn tại trong danh sách của bạn</p>
                <p className="text-xs text-amber-700 mt-1">
                  "<strong>{duplicate.term}</strong>" với nghĩa "{duplicate.definition}"
                  {duplicate.partOfSpeech ? ` (${duplicate.partOfSpeech})` : ""} đã được thêm trước đó.
                </p>
                <Link href={`/words/${duplicate.id}`} className="text-xs text-amber-800 underline mt-1 inline-block">
                  Xem từ đã có →
                </Link>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full mt-4" size="lg" disabled={isPending}>
            <Plus className="w-4 h-4 mr-2" />
            {isPending ? "Đang kiểm tra..." : "Thêm từ"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
