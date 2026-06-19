import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
getStats,
type Stats,
} from "@/lib/firestore";

import {
Card,
CardContent,
} from "@/components/ui/card";

import {
BookOpen,
Brain,
Trophy,
FolderTree,
Plus,
GraduationCap,
} from "lucide-react";

export default function Home() {
const { user } = useAuth();

const [stats, setStats] =
useState<Stats | null>(null);

useEffect(() => {
async function load() {
if (!user) return;

  const data =
    await getStats(user.uid);

  setStats(data);
}

load();

}, [user]);

return (
<Layout>
<div className="space-y-8">

    <div>
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="text-muted-foreground mt-1">
        Quản lý và học từ vựng hiệu quả
      </p>
    </div>

    {/* Statistics */}

    <div className="grid md:grid-cols-4 gap-4">

      <Card>
        <CardContent className="p-5">
          <BookOpen className="mb-2" />

          <p className="text-sm text-muted-foreground">
            Tổng từ vựng
          </p>

          <p className="text-2xl font-bold">
            {stats?.totalWords ?? 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <Brain className="mb-2" />

          <p className="text-sm text-muted-foreground">
            Cần ôn tập
          </p>

          <p className="text-2xl font-bold">
            {stats?.dueForReview ?? 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <Trophy className="mb-2" />

          <p className="text-sm text-muted-foreground">
            Thành thạo
          </p>

          <p className="text-2xl font-bold">
            {stats?.masteredWords ?? 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <GraduationCap className="mb-2" />

          <p className="text-sm text-muted-foreground">
            Độ chính xác
          </p>

          <p className="text-2xl font-bold">
            {stats?.accuracy ?? 0}%
          </p>
        </CardContent>
      </Card>

    </div>

    {/* Features */}

    <div>
      <h2 className="text-xl font-semibold mb-4">
        Chức năng
      </h2>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">

        <Link href="/study">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardContent className="p-6 text-center">
              <BookOpen className="mx-auto mb-3" />

              <h3 className="font-semibold">
                Học bài
              </h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quiz">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardContent className="p-6 text-center">
              <Brain className="mx-auto mb-3" />

              <h3 className="font-semibold">
                Kiểm tra
              </h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/words">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardContent className="p-6 text-center">
              <BookOpen className="mx-auto mb-3" />

              <h3 className="font-semibold">
                Từ vựng
              </h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/words/new">
          <Card className="cursor-pointer hover:shadow-lg transition">
            <CardContent className="p-6 text-center">
              <Plus className="mx-auto mb-3" />

              <h3 className="font-semibold">
                Thêm từ
              </h3>
            </CardContent>
          </Card>
        </Link>

        <Link href="/groups">
          <Card className="cursor-pointer hover:shadow-lg transition border-blue-500">
            <CardContent className="p-6 text-center">
              <FolderTree className="mx-auto mb-3 text-blue-500" />

              <h3 className="font-semibold">
                Nhóm từ vựng
              </h3>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>

  </div>
</Layout>

);
}
