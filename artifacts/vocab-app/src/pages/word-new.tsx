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
import { ArrowLeft, Plus, AlertCircle, Copy, Check, Search } from "lucide-react";
import { Link, useLocation } from "wouter";

const POS_OPTIONS = [
  { value: "Noun", label: "Danh từ" },
  { value: "Verb", label: "Động từ" },
  { value: "Adjective", label: "Tính từ" },
  { value: "Adverb", label: "Trạng từ" },
  { value: "Idiom", label: "Thành ngữ" }
];

export default function WordNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [isPending, setIsPending] = useState(false);
  const [allWords, setAllWords] = useState<Word[]>([]);
  
  // State phục vụ tính năng tìm kiếm từ cũ để copy nghĩa
  const [searchQuery, setSearchQuery] = useState("");

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
    listWords(user.uid).then(setAllWords).catch(console.error);
  }, [user]);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground animate-pulse">Đang xác thực tài khoản...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">Bạn cần đăng nhập để thêm từ vựng mới!</p>
        <Link href="/login" className="text-sm text-primary underline">
          Đi đến trang đăng nhập
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleTogglePos = (posValue: string) => {
    const currentArray = form.partOfSpeech ? form.partOfSpeech.split(", ") : [];
    if (currentArray.includes(posValue)) {
      const newArray = currentArray.filter(item => item !== posValue);
      set("partOfSpeech")(newArray.join(", "));
    } else {
      set("partOfSpeech")([...currentArray, posValue].join(", "));
    }
  };

  // Logic sao chép nghĩa từ một từ vựng được tìm thấy
  const handleCopyWord = (wordId: string) => {
    const source = allWords.find((w) => w.id === wordId);
    if (!source) return;
    setForm((f) => ({
      ...f,
      definition: source.definition || "",
      example: source.example || "",
      pronunciation: source.pronunciation || "",
      partOfSpeech: source.partOfSpeech || "",
      category: source.category || "",
      difficulty: source.difficulty || "medium",
    }));
  };

  // Lọc danh sách từ vựng theo nội dung người dùng nhập vào ô tìm kiếm
  const filteredWords = allWords.filter((w) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      w.term.toLowerCase().includes(query) ||
      (w.definition && w.definition.toLowerCase().includes(query))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setDuplicate(null);
    setErrors({});
    setIsPending(true);

    const newErrors: Record<string, string> = {};
    if (!form.term || !form.term.trim()) newErrors.term = "Vui lòng nhập từ tiếng Anh";
    if (!form.definition || !form.definition.trim()) newErrors.definition = "Vui lòng nhập nghĩa của từ";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsPending(false);
      return;
    }

    try {
      const input: any = {
        term: form.term.trim(),
        definition: form.definition.trim(),
        difficulty: form.difficulty,
      };

      if (form.partOfSpeech && form.partOfSpeech.trim()) input.partOfSpeech = form.partOfSpeech.trim();
      if (form.example && form.example.trim()) input.example = form.example.trim();
      if (form.pronunciation && form.pronunciation.trim()) input.pronunciation = form.pronunciation.trim();
      if (form.category && form.category.trim()) input.category = form.category.trim();

      const dup = await findDuplicate(user.uid, input);
      if (dup) {
        setDuplicate(dup);
        setIsPending(false);
        return;
      }

      await createWord(user.uid, input);
      window.location.href = "/words";
    } catch (error) {
      console.error("Lỗi hệ thống khi thêm từ:", error);
      setErrors({
        submit: "Hệ thống gặp sự cố khi lưu dữ liệu. Vui lòng thử lại.",
      });
      setIsPending(false);
    }
  };  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <Link href="/words" className="flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Thêm từ vựng mới</h1>
        </div>

        {/* Ô TÌM KIẾM ĐỂ COPY NGHĨA TỪ CŨ */}
        {allWords.length > 0 && (
          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="search-word" className="text-primary font-medium flex items-center gap-1.5">
                  <Search className="w-4 h-4" /> Tra cứu nhanh từ vựng cũ để sao chép nghĩa
                </Label>
                <Input
                  id="search-word"
                  placeholder="Gõ từ tiếng Anh hoặc nghĩa tiếng Việt để tra nhanh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Hộp danh sách kết quả tìm kiếm */}
              {searchQuery.trim() !== "" && (
                <div className="border rounded-md max-h-44 overflow-y-auto divide-y bg-background shadow-inner">
                  {filteredWords.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Không tìm thấy từ nào khớp với nội dung tra cứu
                    </div>
                  ) : (
                    filteredWords.map((word) => (
                      <div
                        key={word.id}
                        className="p-2.5 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="truncate pr-3">
                          <span className="font-semibold text-foreground">{word.term}</span>{" "}
                          <span className="text-xs text-muted-foreground italic">({word.partOfSpeech || "chưa rõ loại"})</span>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{word.definition}</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 flex-shrink-0 font-medium text-xs gap-1"
                          onClick={() => {
                            handleCopyWord(word.id || "");
                            setSearchQuery(""); // Copy xong tự động xóa trống ô tìm kiếm cho gọn
                          }}
                        >
                          <Copy className="w-3 h-3" /> Sao chép
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FORM CHÍNH THÊM TỪ VỰNG */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="term">Từ vựng tiếng Anh <span className="text-destructive">*</span></Label>
                <Input
                  id="term"
                  placeholder="Ví dụ: Ephemeral, Break a leg..."
                  value={form.term}
                  onChange={(e) => set("term")(e.target.value)}
                  className={errors.term ? "border-destructive" : ""}
                />
                {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="pronunciation" className="text-muted-foreground">Phiên âm <span className="text-xs font-normal">(Tùy chọn)</span></Label>
                  <Input
                    id="pronunciation"
                    placeholder="Ví dụ: /ɪˈfemərəl/"
                    value={form.pronunciation}
                    onChange={(e) => set("pronunciation")(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Từ loại / Dạng từ <span className="text-xs font-normal">(Có thể chọn nhiều)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {POS_OPTIONS.map((pos) => {
                      const isSelected = form.partOfSpeech.split(", ").includes(pos.value);
                      return (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => handleTogglePos(pos.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="definition">Định nghĩa / Nghĩa của từ <span className="text-destructive">*</span></Label>
                <Textarea
                  id="definition"
                  placeholder="Nhập ý nghĩa tiếng Việt chi tiết của từ..."
                  value={form.definition}
                  onChange={(e) => set("definition")(e.target.value)}
                  className={errors.definition ? "border-destructive" : ""}
                />
                {errors.definition && <p className="text-xs text-destructive">{errors.definition}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="example" className="text-muted-foreground">Ví dụ minh họa <span className="text-xs font-normal">(Tùy chọn)</span></Label>
                <Textarea
                  id="example"
                  placeholder="Đặt câu ví dụ giúp bạn dễ nhớ từ này hơn..."
                  value={form.example}
                  onChange={(e) => set("example")(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-muted-foreground">Danh mục / Chủ đề <span className="text-xs font-normal">(Tùy chọn)</span></Label>
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

              {duplicate && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Từ này đã tồn tại:</span> "{duplicate.term}" đã có trong hệ thống với nghĩa là "{duplicate.definition}".
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <div>{errors.submit}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Link href="/words">
                  <Button type="button" variant="ghost" disabled={isPending}>
                    Hủy bỏ
                  </Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  {isPending ? "Đang lưu..." : "Thêm từ vựng"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

  
