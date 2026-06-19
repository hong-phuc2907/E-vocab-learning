import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
getStats,
listGroups,
type Group,
type Stats,
} from "@/lib/firestore";

import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card";

import {
FolderTree,
BookOpen,
Brain,
Trophy,
Plus,
} from "lucide-react";

export default function Home() {
const { user } = useAuth();

const [stats, setStats] =
useState<Stats | null>(null);

const [groups, setGroups] =
useState<Group[]>([]);

useEffect(() => {
async function load() {
if (!user) return;

  const [s, g] =
    await Promise.all([
      getStats(user.uid),
      listGroups(user.uid),
    ]);

  setStats(s);
  setGroups(g);
}

load();

}, [user]);

return (
<Layout>
<div className="space-y-6">

    <h1 className="text-3xl font-bold">
      Dashboard
    </h1>

    <div className="grid md:grid-cols-4 gap-4">

      <Card>
        <CardContent className="p-5">
          <BookOpen className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Tổng từ
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
            Cần ôn
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
          <FolderTree className="mb-2" />
          <p className="text-sm text-muted-foreground">
            Nhóm
          </p>
          <p className="text-2xl font-bold">
            {groups.length}
          </p>
        </CardContent>
      </Card>

    </div>

    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">

          <CardTitle>
            Nhóm từ vựng
          </CardTitle>

          <Link href="/groups">
            <button className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus size={16} />
              Quản lý nhóm
            </button>
          </Link>

        </div>
      </CardHeader>

      <CardContent>

        {groups.length === 0 ? (
          <p className="text-muted-foreground">
            Chưa có nhóm từ vựng
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">

            {groups.map(
              (group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                >
                  <div className="border rounded-xl p-4 cursor-pointer hover:bg-muted transition">

                    <FolderTree className="mb-2 text-blue-500" />

                    <h3 className="font-semibold">
                      {group.name}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      {group.wordCount ?? 0}
                      {" "}
                      từ
                    </p>

                  </div>
                </Link>
              )
            )}

          </div>
        )}

      </CardContent>
    </Card>

  </div>
</Layout>

);
}
