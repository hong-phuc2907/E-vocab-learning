import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  getGroup,
  getChildGroups,
  getWordsInGroup,
  createGroupAdvanced,
  listWords,
  addWordToGroup,
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
    } else {
      setParentGroup(null);
    }
  }

  useEffect(() => {
    load();
  }, [user, id]);

  async function createSubGroup() {
    if (!user) return;

    if (!groupName.trim())
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

  function toggleWord(
    wordId: string
  ) {
    setSelectedWords((prev) =>
      prev.includes(wordId)
        ? prev.filter(
            (x) =>
              x !== wordId
          )
        : [...prev, wordId]
    );
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
          w.definition +
          " " +
          (w.synonyms ?? []).join(
            " "
          )
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

        <Card>
          <CardHeader>
            <CardTitle>
              Tạo nhóm con
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

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
              Tạo nhóm con
            </Button>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Nhóm con
            </CardTitle>
          </CardHeader>

          <CardContent>

            {children.length === 0 && (
              <p>
                Chưa có nhóm con
              </p>
            )}

            <div className="grid md:grid-cols-3 gap-3">

              {children.map(
                (g) => (
                  <Link
                    key={g.id}
                    href={`/groups/${g.id}`}
                  >
                    <div className="border rounded-xl p-4 hover:bg-muted cursor-pointer">
                      📁 {g.name}
                    </div>
                  </Link>
                )
              )}

            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Từ trong nhóm
            </CardTitle>
          </CardHeader>

          <CardContent>

            {groupWords.length === 0 && (
              <p>
                Chưa có từ nào
              </p>
            )}

            <div className="space-y-2">

              {groupWords.map(
                (word) => (
                  <div
                    key={word.id}
                    className="border rounded-lg p-3"
                  >
                    <p className="font-medium">
                      {word.term}
                    </p>

                    <p className="text-sm text-muted-foreground">
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

        <Card>
          <CardHeader>
            <CardTitle>
              Thêm từ vào nhóm
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

            <div className="space-y-2 mt-4 max-h-[400px] overflow-auto">

              {filteredWords.map(
                (word) => (
                  <label
                    key={word.id}
                    className="flex gap-3 border rounded-lg p-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWords.includes(
                        word.id
                      )}
                      onChange={() =>
                        toggleWord(
                          word.id
                        )
                      }
                    />

                    <div>
                      <p className="font-medium">
                        {word.term}
                      </p>

                      <p className="text-sm text-muted-foreground">
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
              className="mt-4"
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
