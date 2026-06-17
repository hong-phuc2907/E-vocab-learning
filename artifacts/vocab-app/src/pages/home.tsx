import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { getStats, type Stats } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, GraduationCap, ListOrdered, PlusCircle, BarChart3, ArrowRight, Flame, Target, BookOpen, Zap } from "lucide-react";
import { Link } from "wouter";

const featureCards = [
  {
    href: "/study",
    title: "Học bài",
    desc: "Luyện từ vựng với thẻ lật thông minh",
    icon: BrainCircuit,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    href: "/quiz",
    title: "Kiểm tra",
    desc: "4 lựa chọn, chọn đáp án đúng",
    icon: GraduationCap,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    href: "/words",
    title: "Quản lý từ vựng",
    desc: "Xem, tìm kiếm và xóa từ vựng",
    icon: ListOrdered,
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    href: "/words/new",
    title: "Thêm từ mới",
    desc: "Mở rộng vốn từ của bạn",
    icon: PlusCircle,
    gradient: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
];

const QUOTES = [
  "Mỗi từ mới bạn học là một cánh cửa mở ra thế giới.",
  "Học một ngôn ngữ là sống thêm một cuộc đời.",
  "Kiên trì là chìa khóa của thành công.",
  "Cố gắng mỗi ngày, tiến bộ mỗi ngày! ✨",
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getStats(user.uid).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [user]);

  const firstName = user?.displayName?.split(" ").pop() ?? "bạn";
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  return (
    <Layout>
      <div className="space-y-7">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Xin chào, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Hôm nay bạn muốn học gì nào?</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left — feature cards */}
          <div className="col-span-2 space-y-6">
            {/* Feature cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {featureCards.map((card) => (
                <Link key={card.href} href={card.href}>
                  <div className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <card.icon className={`w-6 h-6 ${card.text}`} />
                      </div>
                      <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <ArrowRight className={`w-4 h-4 ${card.text}`} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Quote */}
            <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4 flex gap-3 items-start">
              <span className="text-xl mt-0.5">💡</span>
              <div>
                <p className="text-sm font-medium text-primary">{quote}</p>
                <p className="text-xs text-muted-foreground mt-0.5">— Câu nói truyền cảm hứng</p>
              </div>
            </div>
          </div>

          {/* Right — profile + stats */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto ring-4 ring-primary/20 mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {user?.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <p className="font-semibold text-foreground">{user?.displayName}</p>
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-3 py-0.5 rounded-full font-medium">
                Vocabulary Learner
              </span>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {[
                {
                  icon: BookOpen,
                  label: "Từ đã lưu",
                  value: stats?.totalWords ?? 0,
                  color: "text-blue-500",
                  bg: "bg-blue-50",
                },
                {
                  icon: Target,
                  label: "Bài kiểm tra đã làm",
                  value: stats?.masteredWords ?? 0,
                  color: "text-violet-500",
                  bg: "bg-violet-50",
                },
                {
                  icon: Zap,
                  label: "Độ chính xác TB",
                  value: stats != null ? `${stats.accuracy}%` : "—",
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                },
                {
                  icon: Flame,
                  label: "Chuỗi ngày học",
                  value: stats != null ? `${stats.currentStreak} ngày` : "—",
                  color: "text-orange-500",
                  bg: "bg-orange-50",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground flex-1">{s.label}</span>
                  {loading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-bold text-foreground text-sm">{s.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Due for review callout */}
            <Link href="/study">
              <div className="bg-primary rounded-2xl p-4 cursor-pointer hover:bg-primary/90 transition-colors text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white/80">Cần ôn tập</span>
                  <ArrowRight className="w-4 h-4 text-white/60" />
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-12 bg-white/20" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.dueForReview ?? 0} từ</p>
                )}
                <p className="text-xs text-white/70 mt-0.5">Bắt đầu học ngay →</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
