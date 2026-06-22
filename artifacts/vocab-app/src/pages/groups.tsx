import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  createGroup,
  listGroups,
  renameGroup,
  deleteGroupSafe,
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

  const [deleteTarget, setDeleteTarget] =
    useState<Group | null>(null);

  const [renameTarget, setRenameTarget] =
    useState<Group | null>(null);

  const [newName, setNewName] =
    useState("");

  async function loadGroups() {
    if (!user) return;

    const data = await listGroups(
      user.uid
    );

    setGroups(data);
  }

  useEffect(() => {
    loadGroups();
  }, [user]);

  async function handleCreate() {
    if (!user) return;

    if (!groupName.trim()) return;

    await createGroup(
      user.uid,
      groupName.trim(),
      null
    );

    setGroupName("");

    await loadGroups();
  }

  async function handleRename() {
    if (!user) return;

    if (!renameTarget) return;

    if (!newName.trim()) return;

    await renameGroup(
      user.uid,
      renameTarget.id,
      newName.trim()
    );

    setRenameTarget(null);
    setNewName("");

    await loadGroups();
  }

  async function handleDelete() {
    if (!user) return;

    if (!deleteTarget) return;

    await deleteGroupSafe(
      user.uid,
      deleteTarget.id
    );

    setDeleteTarget(null);

    await loadGroups();
  }

  const rootGroups =
    groups.filter(
      (g) => !g.parentId
    );

  return (
    <Layout>
      <div className="space-y-6">

        {/* CREATE */}
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

        {/* GROUP LIST */}
        <Card>
          <CardHeader>
            <CardTitle>
              Kho nhóm từ vựng
            </CardTitle>
          </CardHeader>

          <CardContent>

            {rootGroups.length === 0 && (
              <p className="text-muted-foreground">
                Chưa có nhóm nào
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">

              {rootGroups.map(
                (group) => (
                  <div
                    key={group.id}
                    className="border rounded-xl p-4 flex flex-col gap-3"
                  >
                    <Link
                      href={`/groups/${group.id}`}
                    >
                      <div className="cursor-pointer hover:opacity-70">
                        <div className="text-3xl">
                          📁
                        </div>

                        <p className="font-semibold text-lg">
                          {group.name}
                        </p>
                      </div>
                    </Link>

                    <Button
                      asChild
                      size="sm"
                    >
                      <Link
                        href={`/quiz?group=${group.id}`}
                      >
                        Làm bài kiểm tra
                      </Link>
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setRenameTarget(
                            group
                          );

                          setNewName(
                            group.name
                          );
                        }}
                      >
                        Đổi tên
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setDeleteTarget(
                            group
                          )
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                )
              )}

            </div>
          </CardContent>
        </Card>

        {/* RENAME MODAL */}
        {renameTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl p-6 w-[90%] max-w-md space-y-4">

              <h2 className="text-xl font-bold">
                Đổi tên nhóm
              </h2>

              <Input
                value={newName}
                onChange={(e) =>
                  setNewName(
                    e.target.value
                  )
                }
              />

              <div className="flex gap-2 justify-end">

                <Button
                  variant="outline"
                  onClick={() => {
                    setRenameTarget(
                      null
                    );
                  }}
                >
                  Hủy
                </Button>

                <Button
                  onClick={
                    handleRename
                  }
                >
                  Lưu
                </Button>

              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl p-6 w-[90%] max-w-md space-y-4">

              <h2 className="text-xl font-bold text-red-600">
                Xóa nhóm
              </h2>

              <p>
                Bạn có chắc muốn xóa nhóm:
              </p>

              <p className="font-bold">
                {deleteTarget.name}
              </p>

              <p className="text-sm text-muted-foreground">
                Toàn bộ nhóm con và
                từ trong nhóm sẽ bị
                xóa.
              </p>

              <div className="flex gap-2 justify-end">

                <Button
                  variant="outline"
                  onClick={() =>
                    setDeleteTarget(
                      null
                    )
                  }
                >
                  Hủy bỏ
                </Button>

                <Button
                  variant="destructive"
                  onClick={
                    handleDelete
                  }
                >
                  Xác nhận xóa
                </Button>

              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
            }
