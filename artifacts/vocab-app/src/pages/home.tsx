import { Layout } from "@/components/layout";
import { useGetDailyWord, useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Brain, Flame, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: dailyWord, isLoading: isLoadingDaily } = useGetDailyWord();
  const { data: stats, isLoading: isLoadingStats } = useGetStats();

  return (
    <Layout>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-serif font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2 text-lg">Continue building your vocabulary today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Word of the Day</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDaily ? (
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
                <p>No word of the day available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Study Queue</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {isLoadingStats ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <>
                  <div className="text-5xl font-bold text-accent mb-4">{stats?.dueForReview || 0}</div>
                  <p className="text-muted-foreground mb-6">Words ready for review</p>
                  <Button asChild className="w-full">
                    <Link href="/study">Start Study Session</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mastered Words" value={stats?.masteredWords || 0} icon={Target} isLoading={isLoadingStats} />
          <StatCard title="Current Streak" value={stats?.currentStreak || 0} suffix="days" icon={Flame} isLoading={isLoadingStats} />
          <StatCard title="Total Words" value={stats?.totalWords || 0} icon={BookOpen} isLoading={isLoadingStats} />
          <StatCard title="Accuracy" value={stats?.accuracy != null ? `${stats.accuracy}%` : "0%"} icon={Brain} isLoading={isLoadingStats} />
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
