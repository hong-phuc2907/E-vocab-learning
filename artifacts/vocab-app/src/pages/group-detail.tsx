import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  getGroup,
  getChildGroups,
  getWordsInGroup,
  listWords,
  addWordToGroup,
  createGroupAdvanced,
  type Group,
  type Word,
} from "@/lib/firestore";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GroupDetail({
  id,
}: {
  id: string;
}) {
  const { user } = useAuth();

  const [group, setGroup] =
    useState<Group | null>(null);

  const [parentGroup, setParentGroup] =
    useState<Group | null>(null);

  const [children, setChildren] =
    useState<Group[]>([]);

  const [groupWords, setGroupWords] =
    useState<Word[]>([]);

  const [allWords, setAllWords] =
    useState<Word[]>([]);

  const [groupName, setGroupName] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedWords, setSelectedWords] =
    useState<string[]>([]);

  async function load() {
    if (!user) return;

    const [
      g,
      childs,
      wordsInGroup,
      words,
    ] = await Promise.all([
      getGroup(user.uid, id),
      getChildGroups(user.uid, id),
      getWordsInGroup(user.uid, id),
      listWords(user.uid),
    ]);

    setGroup(g);
    setChildren(childs);
    setGroupWords(wordsInGroup);
    setAllWords(words);

    if (g?.parentId) {
      const parent =
        await getGroup(
          user.uid,
          g.parentId
        );
      setParentGroup(parent);
    }
  }

  useEffect(() => {
    load();
  }, [user, id]);

  async function createSubGroup() {
    if (!user || !groupName.trim())
      return;

    await createGroupAdvanced(
      user.uid,
      groupName,
      id
    );

    setGroupName("");
    load();
  }

  async function addWords() {
    if (!user) return;

    for (const wordId of selectedWords) {
      await addWordToGroup(
        user.uid,
        wordId,
        id
      );
    }

    setSelectedWords([]);
    load();
  }

  const availableWords =
    allWords.filter(
      (w) =>
        !groupWords.some(
          (g) => g.id === w.id
        )
    );

  const filteredWords =
    availableWords.filter(
      (w) =>
        (
          w.term +
          " " +
          w.definition
        )
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex gap-2">

          <Link href="/groups">
            <Button
              size="sm"
              variant="outline"
            >
              🏠 Gốc
            </Button>
          </Link>

          {parentGroup && (
            <Link
              href={`/groups/${parentGroup.id}`}
            >
              <Button
                size="sm"
                variant="outline"
              >
                ⬅ Nhóm cha
              </Button>
            </Link>
          )}

        </div>

        <div>
          <h1 className="text-3xl font-bold">
            📁 {group?.name}
          </h1>
        </div>

        {/* TỪ TRONG NHÓM */}

        <Card>
          <CardHeader>
            <CardTitle>
              📚 Từ trong nhóm (
              {groupWords.length})
            </CardTitle>
          </CardHeader>

          <CardContent>

            {groupWords.length === 0 && (
              <p className="text-muted-foreground">
                Chưa có từ nào
              </p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">

              {groupWords.map(
                (word) => (
                  <div
                    key={word.id}
                    className="border rounded-xl p-4 hover:shadow-md transition"
                  >
                    <p className="font-semibold">
                      {word.term}
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      {
                        word.definition
                      }
                    </p>
                  </div>
                )
              )}

            </div>

          </CardContent>
        </Card>

        {/* NHÓM CON */}

        <Card>
          <CardHeader>
            <CardTitle>
              📁 Nhóm con
            </CardTitle>
          </CardHeader>

          <CardContent>

            <div className="flex flex-wrap gap-2">

              {children.map(
                (g) => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                  >
                    <div className="border rounded-lg px-3 py-2 hover:bg-muted cursor-pointer">
                      📁 {g.name}
                    </div>
                  </Link>
                )
              )}

              {children.length === 0 && (
                <p className="text-muted-foreground">
                  Chưa có nhóm con
                </p>
              )}

            </div>

          </CardContent>
        </Card>

        {/* TẠO NHÓM CON */}

        <Card>
          <CardContent className="pt-6 flex gap-2">

            <Input
              placeholder="Tên nhóm con"
              value={groupName}
              onChange={(e) =>
                setGroupName(
                  e.target.value
                )
              }
            />

            <Button
              onClick={
                createSubGroup
              }
            >
              Tạo
            </Button>

          </CardContent>
        </Card>

        {/* THÊM TỪ */}

        <Card>
          <CardHeader>
            <CardTitle>
              ➕ Thêm từ
            </CardTitle>
          </CardHeader>

          <CardContent>

            <Input
              placeholder="Tìm từ..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

            <div className="max-h-48 overflow-auto mt-3 space-y-2">

              {filteredWords.map(
                (word) => (
                  <label
                    key={word.id}
                    className="flex gap-2 border rounded-lg p-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(
                        word.id
                      )}
                      onChange={() =>
                        setSelectedWords(
                          (prev) =>
                            prev.includes(
                              word.id
                            )
                              ? prev.filter(
                                  (
                                    x
                                  ) =>
                                    x !==
                                    word.id
                                )
                              : [
                                  ...prev,
                                  word.id,
                                ]
                        )
                      }
                    />

                    <div>
                      <p className="font-medium">
                        {word.term}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          word.definition
                        }
                      </p>
                    </div>
                  </label>
                )
              )}

            </div>

            <Button
              className="mt-3"
              onClick={addWords}
            >
              Thêm vào nhóm
            </Button>

          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
