import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
<Button
  type="button"
  size="sm"
  variant="outline"
  onClick={() => {
    console.log("CLICK RENAME", g.id);
    setEditingGroup(g);
    setRenameValue(g.name);
  }}
>
  Đổi tên
</Button>
import {
getGroup,
getChildGroups,
getWordsInGroup,
listWords,
addWordToGroup,
createGroupAdvanced,
renameGroup,
deleteGroupSafe,
removeWordFromGroup,
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

const [renameValue, setRenameValue] =
useState("");

const [editingGroup, setEditingGroup] =
useState<Group | null>(null);

const [deletingGroup, setDeletingGroup] =
useState<Group | null>(null);

async function load() {
if (!user || !id) return;

try {
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

  setGroup(g ?? null);
  setChildren(childs ?? []);
  setGroupWords(wordsInGroup ?? []);
  setAllWords(words ?? []);

  if (g?.parentId) {
    const parent = await getGroup(
      user.uid,
      g.parentId
    );
    setParentGroup(parent ?? null);
  } else {
    setParentGroup(null);
  }
} catch (err) {
  console.error(err);
}

}

useEffect(() => {
load();
}, [user, id]);

async function createSubGroup() {
if (!user) return;
if (!groupName.trim()) return;

await createGroupAdvanced(
  user.uid,
  {
    name: groupName.trim(),
    parentId: id,
    description: "",
    color: "#3b82f6",
    icon: "📁",
  }
);

setGroupName("");
load();

}

async function addWords() {
if (!user) return;
if (!id) return;

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

async function removeWord(
wordId: string
) {
if (!user) return;

await removeWordFromGroup(
  user.uid,
  wordId,
  id
);

load();

}

async function handleRename() {
if (!user) return;
if (!editingGroup) return;
if (!renameValue.trim()) return;

await renameGroup(
  user.uid,
  editingGroup.id,
  renameValue.trim()
);

setEditingGroup(null);
setRenameValue("");

load();

}

async function handleDelete() {
if (!user) return;
if (!deletingGroup) return;

await deleteGroupSafe(
  user.uid,
  deletingGroup.id
);

setDeletingGroup(null);

if (
  deletingGroup.id === id &&
  window.history.length > 1
) {
  window.history.back();
}

load();

}

const safeAllWords =
allWords ?? [];

const safeGroupWords =
groupWords ?? [];

const availableWords =
safeAllWords.filter(
(w) =>
!safeGroupWords.some(
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

    <div className="flex flex-wrap items-center gap-3">

      <h1 className="text-3xl font-bold">
        📁 {group?.name}
      </h1>

      {group && (
        <>
          <Link
            href={`/quiz?group=${group.id}`}
          >
            <Button>
              📝 Kiểm tra
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              setEditingGroup(group);
              setRenameValue(
                group.name
              );
            }}
          >
            ✏️ Đổi tên
          </Button>

          <Button
            variant="destructive"
            onClick={() =>
              setDeletingGroup(group)
            }
          >
            🗑 Xóa
          </Button>
        </>
      )}

    </div>
  {/* TỪ TRONG NHÓM */}
<Card>
<CardHeader>
<CardTitle>
📚 Từ trong nhóm ({safeGroupWords.length})
</CardTitle>
</CardHeader>

      <CardContent>

        {safeGroupWords.length === 0 && (
          <p className="text-muted-foreground">
            Chưa có từ nào
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">

          {safeGroupWords.map(
            (word) => (
              <div
                key={word.id}
                className="border rounded-xl p-4"
              >
                <div className="flex justify-between items-start gap-2">

                  <div>
                    <p className="font-semibold">
                      {word.term}
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      {word.definition}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      removeWord(
                        word.id
                      )
                    }
                  >
                    X
                  </Button>

                </div>
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

        <div className="space-y-2">
{children.map((g) => (
  <div
  key={g.id}
  className="border rounded-lg p-3 flex items-center justify-between"
>
  <div className="flex items-center gap-3">

    <button
      type="button"
      className="font-medium hover:text-blue-600"
      onClick={() => {
        window.location.href = `/groups/${g.id}`;
      }}
    >
      📁 {g.name}
    </button>

  </div>

  <div className="flex gap-2">

    <Button
      type="button"
      size="sm"
      onClick={() => {
        window.location.href = `/quiz?group=${g.id}`;
      }}
    >
      Kiểm tra
    </Button>

    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => {
        console.log("rename", g.name);
        setEditingGroup(g);
        setRenameValue(g.name);
      }}
    >
      Đổi tên
    </Button>

    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={() => {
        console.log("delete", g.name);
        setDeletingGroup(g);
      }}
    >
      Xóa
    </Button>

  </div>
</div>
))}

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

        <div className="max-h-56 overflow-auto mt-3 space-y-2">

          {filteredWords.map(
            (word) => (
              <label
                key={word.id}
                className="flex gap-2 border rounded-lg p-2 items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedWords.includes(
                    word.id
                  )}
                  onChange={() =>
                    setSelectedWords(
                      (
                        prev
                      ) =>
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
          disabled={
            selectedWords.length ===
            0
          }
          onClick={addWords}
        >
          Thêm vào nhóm
        </Button>

      </CardContent>
    </Card>

    {/* MODAL ĐỔI TÊN */}
{editingGroup && (
  <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
    <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>
            ✏️ Đổi tên nhóm
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">

          <Input
            value={renameValue}
            onChange={(e) =>
              setRenameValue(
                e.target.value
              )
            }
          />

          <div className="flex gap-2">

            <Button
              onClick={
                handleRename
              }
            >
              Lưu
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setEditingGroup(
                  null
                )
              }
            >
              Hủy
            </Button>

          </div>

        </CardContent>
      </Card>
    )}

    {/* MODAL XÓA */}
    {deletingGroup && (
      <Card>
        <CardHeader>
          <CardTitle>
            🗑 Xóa nhóm
          </CardTitle>
        </CardHeader>

        <CardContent>

          <p>
            Xóa nhóm:
            <b>
              {" "}
              {
                deletingGroup.name
              }
            </b>
            ?
          </p>

          <div className="flex gap-2 mt-3">

            <Button
              variant="destructive"
              onClick={
                handleDelete
              }
            >
              Xóa
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setDeletingGroup(
                  null
                )
              }
            >
              Hủy
            </Button>

          </div>

        </CardContent>
      </Card>
    </div>
)}

  </div>
</Layout>

);
  }
