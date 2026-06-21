import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import {
  listWords,
  reviewWord,
  updateStreak,
  listGroups, // Đã thêm
  type Word,
  type Group, // Đã thêm
} from "@/lib/firestore";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  GraduationCap,
  Clock,
} from "lucide-react";

import { Link } from "wouter";
import { MascotCelebration } from "@/components/mascot-celebration";

// ... (giữ nguyên các hàm helper: shuffle, normalizeAnswer, parseAnswers)

export default function Quiz() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [groups, setGroups] = useState<Group[]>([]); // Thêm state nhóm
  const [selectedGroup, setSelectedGroup] = useState("all"); // Thêm state chọn nhóm
  const [isLoading, setIsLoading] = useState(true);
  
  // ... (giữ nguyên các state khác: started, currentIndex, v.v.)
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("multiple-choice");
  const [questionCount, setQuestionCount] = useState(10);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [multiChecked, setMultiChecked] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load danh sách nhóm và từ
  useEffect(() => {
    if (!user) return;

    Promise.all([
      listWords(user.uid),
      listGroups(user.uid),
    ]).then(([words, groups]) => {
      setAllWords(words);
      setGroups(groups);
      setIsLoading(false);
    });
  }, [user]);

  // Logic lọc từ kết hợp theo ngày và nhóm (bao gồm nhóm con)
  const filteredWords = useMemo(() => {
    let words = [...allWords];

    // Lọc theo nhóm
    if (selectedGroup !== "all") {
      const groupIds = groups
        .filter(g => g.id === selectedGroup || g.path?.includes(selectedGroup))
        .map(g => g.id);

      words = words.filter(w => w.groupIds?.some(id => groupIds.includes(id)));
    }

    // Lọc theo ngày
    if (dateFilter !== "all") {
      const now = new Date();
      words = words.filter((word) => {
        if (!word.createdAt) return true;
        const created = new Date(word.createdAt);
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        switch (dateFilter) {
          case "today": return diffDays === 0;
          case "yesterday": return diffDays === 1;
          case "3days": return diffDays <= 3;
          case "7days": return diffDays <= 7;
          default: return true;
        }
      });
    }
    
    return words;
  }, [allWords, dateFilter, selectedGroup, groups]);

  // ... (phần còn lại của code: questions, handlers, render UI)
  // Trong UI, thêm select vào dưới dateFilter:
  
  /* <select
    className="w-full border rounded-lg p-2"
    value={selectedGroup}
    onChange={(e) => setSelectedGroup(e.target.value)}
  >
    <option value="all">Tất cả nhóm</option>
    {groups.map((group) => (
      <option key={group.id} value={group.id}>{group.name}</option>
    ))}
  </select>
  */
}
