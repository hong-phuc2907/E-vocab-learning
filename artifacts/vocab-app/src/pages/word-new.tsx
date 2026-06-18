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

  // Lưu ý: Đoạn code cũ của bạn bị thiếu phần render (return về JSX) của component này.
  // Dưới đây mình tạm thời đóng dấu ngoặc nhọn của hàm WordNew() để hết lỗi biên dịch.
  // Bạn cần viết thêm phần return <Layout>...</Layout> cho giao diện hiển thị tại đây nếu chưa có nhé.
}

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

 
