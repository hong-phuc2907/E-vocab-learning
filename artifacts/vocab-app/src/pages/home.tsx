import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import { getDailyWord, getStats, type Word, type Stats } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Brain, Flame, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  const [dailyWord, setDailyWord] = useState<Word | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getDailyWord(user.uid), getStats(user.uid)]).then(([w, s]) => {
      setDailyWord(w);
      setStats(s);
      setLoading(false);
    });
  }, [user]);

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-serif font-bold text-foreground">Chào mừng trở lại</h1>
          <p className="text-muted-foreground mt-2 text-lg">Tiếp tục xây dựng vốn từ vựng của bạn hôm nay.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Từ trong ngày</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/2 bg-primary-foreground/20" />
                  <Skeleton className="h-4 w-full bg-primary-foreground/20" />
                </div>
              ) : dailyWord ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-serif font-bold">{dailyWord.term}</h2>
                    {dailyWord.pronunciation && <p className="text-primary-foreground/80 font-mono mt-1">{dailyWord.pronunciation}</p>}
                  </div>
                  <p className="text-lg leading-relaxed">{dailyWord.definition}</p>
                </div>
              ) : (
                <p>Chưa có từ nào. Hãy thêm từ vựng đầu tiên!</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hàng chờ học</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {loading ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <>
                  <div className="text-5xl font-bold text-accent mb-4">{stats?.dueForReview ?? 0}</div>
                  <p className="text-muted-foreground mb-6">Từ cần ôn tập</p>
                  <Button asChild className="w-full">
                    <Link href="/study">Bắt đầu học</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Từ đã thành thạo" value={stats?.masteredWords ?? 0} icon={Target} isLoading={loading} />
          <StatCard title="Chuỗi học" value={stats?.currentStreak ?? 0} suffix="ngày" icon={Flame} isLoading={loading} />
          <StatCard title="Tổng số từ" value={stats?.totalWords ?? 0} icon={BookOpen} isLoading={loading} />
          <StatCard title="Độ chính xác" value={stats != null ? `${stats.accuracy}%` : "0%"} icon={Brain} isLoading={loading} />
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, suffix, icon: Icon, isLoading }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 bg-secondary rounded-lg text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-12 mt-1" />
          ) : (
            <p className="text-2xl font-bold">
              {value} {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
