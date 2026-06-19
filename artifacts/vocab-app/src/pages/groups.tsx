import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  createGroup,
  listGroups,
  type Group,
} from "@/lib/firestore";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GroupsPage() {
  const { user } = useAuth();

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [groupName, setGroupName] =
    useState("");

  async function loadGroups() {
    if (!user) return;

    const data =
      await listGroups(user.uid);

    setGroups(data);
  }

  useEffect(() => {
    loadGroups();
  }, [user]);

  async function handleCreate() {
    if (
      !user ||
      !groupName.trim()
    )
      return;

    await createGroup(
      user.uid,
      groupName,
      null
    );

    setGroupName("");

    loadGroups();
  }

  const rootGroups =
    groups.filter(
      (g) => !g.parentId
    );

  return (
    <Layout>
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>
              Tạo thư mục mới
            </CardTitle>
          </CardHeader>

          <CardContent className="flex gap-2">
            <Input
              placeholder="Tên nhóm"
              value={groupName}
              onChange={(e) =>
                setGroupName(
                  e.target.value
                )
              }
            />

            <Button
              onClick={handleCreate}
            >
              Tạo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Kho nhóm từ vựng
            </CardTitle>
          </CardHeader>

          <CardContent>

            {rootGroups.length ===
              0 && (
              <p className="text-muted-foreground">
                Chưa có nhóm nào
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-3">

              {rootGroups.map(
                (group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                  >
                    <div className="border rounded-xl p-4 cursor-pointer hover:bg-muted transition">

                      <div className="text-3xl mb-2">
                        📁
                      </div>

                      <p className="font-semibold">
                        {group.name}
                      </p>

                    </div>
                  </Link>
                )
              )}

            </div>

          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
