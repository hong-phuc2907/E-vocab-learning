import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import {
createWord,
findDuplicate,
listWords,
type Word,
} from "@/lib/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, AlertCircle, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function WordNew() {
const { user } = useAuth();
const [, navigate] = useLocation();

const [isPending, setIsPending] = useState(false);

const [allWords, setAllWords] = useState<Word[]>([]);
const [copyWordId, setCopyWordId] = useState("");

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

useEffect(() => {
if (!user) return;

listWords(user.uid).then(setAllWords);

}, [user]);

const set =
(key: keyof typeof form) =>
(value: string) => {
setForm((f) => ({
...f,
[key]: value,
}));
};

const handleCopyWord = (wordId: string) => {
const source = allWords.find((w) => w.id === wordId);

if (!source) return;

setForm((f) => ({
  ...f,
  definition: source.definition,
  example: source.example || "",
  pronunciation: source.pronunciation || "",
  partOfSpeech: source.partOfSpeech || "",
  category: source.category || "",
  difficulty: source.difficulty || "medium",
}));

};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

if (!user) return;

setDuplicate(null);

const newErrors: Record<string, string> = {};

if (!form.term.trim()) {
  newErrors.term = "Vui lòng nhập từ";
}

if (!form.definition.trim()) {
  newErrors.definition = "Vui lòng nhập nghĩa";
}

if (Object.keys(newErrors).length > 0) {
  setErrors(newErrors);
  return;
}

setIsPending(true);

const input = {
  term: form.term.trim(),
  definition: form.definition.trim(),
  partOfSpeech: form.partOfSpeech || undefined,
  example: form.example || undefined,
  pronunciation: form.pronunciation || undefined,
  category: form.category || undefined,
  difficulty: form.difficulty,
};

const dup = await findDuplicate(user.uid, input);

if (dup) {
  setDuplicate(dup);
  setIsPending(false);
  return;
}

setLoading(true);

try {
  await createWord(user.uid, data);
} catch (err) {
  console.error(err);
} finally {
  setLoading(false);
}

return (
<Layout>
<div className="max-w-xl space-y-6">
<div className="flex items-center gap-4">
<Button variant="ghost" asChild className="-ml-2">
<Link href="/words">
<ArrowLeft className="w-4 h-4 mr-2" />
Quay lại
</Link>
</Button>
</div>

    <div>
      <h1 className="text-3xl font-serif font-bold">
        Thêm từ mới
      </h1>

      <p className="text-muted-foreground mt-1">
        Mở rộng vốn từ vựng của bạn từng từ một.
      </p>
    </div>

    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-5">

          <div className="space-y-2">
            <Label>Sao chép thông tin từ từ đã có</Label>

            <div className="flex gap-2">
              <Select
                value={copyWordId}
                onValueChange={setCopyWordId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn từ..." />
                </SelectTrigger>

                <SelectContent>
                  {allWords.map((word) => (
                    <SelectItem
                      key={word.id}
                      value={word.id}
                    >
                      {word.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleCopyWord(copyWordId)
                }
                disabled={!copyWordId}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Từ hoặc cụm từ
              <span className="text-destructive"> *</span>
            </Label>

            <Input
              value={form.term}
              onChange={(e) =>
                set("term")(e.target.value)
              }
              placeholder="VD: ephemeral"
            />

            {errors.term && (
              <p className="text-xs text-destructive">
                {errors.term}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Phiên âm</Label>

            <Input
              value={form.pronunciation}
              onChange={(e) =>
                set("pronunciation")(e.target.value)
              }
              placeholder="/ɪˈfem.ər.əl/"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Nghĩa
              <span className="text-destructive"> *</span>
            </Label>

            <Textarea
              rows={3}
              value={form.definition}
              onChange={(e) =>
                set("definition")(e.target.value)
              }
            />

            {errors.definition && (
              <p className="text-xs text-destructive">
                {errors.definition}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Câu ví dụ</Label>

            <Textarea
              rows={3}
              value={form.example}
              onChange={(e) =>
                set("example")(e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Từ loại</Label>

              <Select
                value={form.partOfSpeech}
                onValueChange={set("partOfSpeech")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="noun">Danh từ</SelectItem>
                  <SelectItem value="verb">Động từ</SelectItem>
                  <SelectItem value="adjective">Tính từ</SelectItem>
                  <SelectItem value="adverb">Trạng từ</SelectItem>
                  <SelectItem value="phrase">Cụm từ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Độ khó</Label>

              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  set("difficulty")(v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Danh mục</Label>

            <Input
              value={form.category}
              onChange={(e) =>
                set("category")(e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {duplicate && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-medium text-amber-800">
              Từ này đã tồn tại
            </p>

            <p className="text-xs text-amber-700 mt-1">
              {duplicate.term}
            </p>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full mt-4"
        size="lg"
        disabled={isPending}
      >
        <Plus className="w-4 h-4 mr-2" />

        {isPending
          ? "Đang thêm..."
          : "Thêm từ"}
      </Button>
    </form>
  </div>
</Layout>

);
}
