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

  const set = (key: keyof typeof form) => (value: string) => {
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
    setErrors({});

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

    try {
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
        return;
      }

      await createWord(user.uid, input);

      navigate("/words");
    } catch (error) {
      console.error("Lỗi khi thêm từ:", error);

      setErrors({
        submit: "Không thể thêm từ vựng. Vui lòng thử lại.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        {/* Nút quay lại */}
        <div className="flex items-center justify-between">
          <Link href="/words" className="flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Thêm từ vựng mới</h1>
        </div>

        {/* Tính năng Sao chép nhanh từ đã có */}
        {allWords.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="copy-word">Sao chép nhanh từ định nghĩa cũ</Label>
                <div className="flex gap-2">
                  <Select value={copyWordId} onValueChange={setCopyWordId}>
                    <SelectTrigger id="copy-word" className="w-full">
                      <SelectValue placeholder="Chọn từ muốn sao chép thông tin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allWords.map((word) => (
                        <SelectItem key={word.id} value={word.id || ""}>
                          {word.term} ({word.partOfSpeech || "chưa phân loại"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleCopyWord(copyWordId)}
                    disabled={!copyWordId}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Sao chép
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form nhập liệu chính */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Từ vựng */}
              <div className="space-y-1.5">
                <Label htmlFor="term">Từ vựng <span className="text-destructive">*</span></Label>
                <Input
                  id="term"
                  placeholder="Ví dụ: Ephemeral, Serendipity..."
                  value={form.term}
                  onChange={(e) => set("term")(e.target.value)}
                  className={errors.term ? "border-destructive" : ""}
                />
                {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
              </div>

              {/* Phiên âm & Từ loại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pronunciation">Phiên âm</Label>
                  <Input
                    id="pronunciation"
                    placeholder="Ví dụ: /ɪˈfemərəl/"
                    value={form.pronunciation}
                    onChange={(e) => set("pronunciation")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="partOfSpeech">Từ loại</Label>
                  <Input
                    id="partOfSpeech"
                    placeholder="Ví dụ: Noun, Verb, Adjective..."
                    value={form.partOfSpeech}
                    onChange={(e) => set("partOfSpeech")(e.target.value)}
                  />
                </div>
              </div>

              {/* Định nghĩa / Nghĩa của từ */}
              <div className="space-y-1.5">
                <Label htmlFor="definition">Định nghĩa / Nghĩa của từ <span className="text-destructive">*</span></Label>
                <Textarea
                  id="definition"
                  placeholder="Nhập ý nghĩa chi tiết của từ..."
                  value={form.definition}
                  onChange={(e) => set("definition")(e.target.value)}
                  className={errors.definition ? "border-destructive" : ""}
                />
                {errors.definition && <p className="text-xs text-destructive">{errors.definition}</p>}
              </div>

              {/* Ví dụ minh họa */}
              <div className="space-y-1.5">
                <Label htmlFor="example">Ví dụ minh họa</Label>
                <Textarea
                  id="example"
                  placeholder="Đặt câu ví dụ giúp bạn dễ nhớ từ này hơn..."
                  value={form.example}
                  onChange={(e) => set("example")(e.target.value)}
                />
              </div>

              {/* Danh mục & Mức độ khó */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Danh mục (Chủ đề)</Label>
                  <Input
                    id="category"
                    placeholder="Ví dụ: Công nghệ, Đời sống..."
                    value={form.category}
                    onChange={(e) => set("category")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty">Mức độ khó</Label>
                  <Select 
                    value={form.difficulty} 
                    onValueChange={(val: "easy" | "medium" | "hard") => set("difficulty")(val)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Chọn độ khó" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Dễ (Easy)</SelectItem>
                      <SelectItem value="medium">Trung bình (Medium)</SelectItem>
                      <SelectItem value="hard">Khó (Hard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Thông báo lỗi trùng lặp từ */}
              {duplicate && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Từ này đã tồn tại:</span> "{duplicate.term}" đã có trong hệ thống với nghĩa là "{duplicate.definition}".
                  </div>
                </div>
              )}

              {/* Thông báo lỗi hệ thống chung khi submit */}
              {errors.submit && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>{errors.submit}</div>
                </div>
              )}

              {/* Thanh hành động bấm lưu */}
              <div className="flex justify-end gap-2 pt-2">
                <Link href="/words">
                  <Button type="button" variant="ghost" disabled={isPending}>
                    Hủy bỏ
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isPending ? "Đang lưu..." : "Thêm từ vựng"}
                </
      
