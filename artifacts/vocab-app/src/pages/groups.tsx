import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
createGroup,
listGroups,
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

export default function GroupsPage() {
const { user } = useAuth();

const [groups, setGroups] = useState<Group[]>([]);
const [words, setWords] = useState<Word[]>([]);

const [groupName, setGroupName] = useState("");
const [parentId, setParentId] = useState<string | null>(null);

const [search, setSearch] = useState("");
const [selectedWords, setSelectedWords] = useState<string[]>([]);

async function loadData() {
if (!user) return;

const [g, w] = await Promise.all([
  listGroups(user.uid),
  listWords(user.uid),
]);

setGroups(g);
setWords(w);

}

useEffect(() => {
loadData();
}, [user]);

async function handleCreateGroup() {
if (!user || !groupName.trim()) return;

await createGroup(
  user.uid,
  groupName,
  parentId
);

setGroupName("");
setParentId(null);

loadData();

}

async function handleAddWords() {
if (!user) return;

if (!parentId) {
  alert("Hãy chọn nhóm");
  return;
}

try {
  for (const wordId of selectedWords) {
    await addWordToGroup(
      user.uid,
      wordId,
      parentId
    );
  }

  alert("Đã thêm từ vào nhóm");
} catch (err) {
  console.error(err);
  alert("Lỗi khi thêm từ");
}

}

function toggleWord(id: string) {
setSelectedWords((prev) =>
prev.includes(id)
? prev.filter((x) => x !== id)
: [...prev, id]
);
}

const filteredWords = words.filter((w) =>
(
w.term +
" " +
w.definition +
" " +
(w.synonyms ?? []).join(" ")
)
.toLowerCase()
.includes(search.toLowerCase())
);

return (
<Layout>
<div className="space-y-6">

    <Card>
      <CardHeader>
        <CardTitle>Tạo nhóm</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        <Input
          placeholder="Tên nhóm"
          value={groupName}
          onChange={(e) =>
            setGroupName(e.target.value)
          }
        />

        {parentId && (
          <p className="text-sm text-blue-600">
            Đang tạo nhóm con
          </p>
        )}

        <Button onClick={handleCreateGroup}>
          Tạo nhóm
        </Button>

      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Danh sách nhóm</CardTitle>
      </CardHeader>

      <CardContent>

        {groups.length === 0 && (
          <p>Chưa có nhóm nào</p>
        )}

        <div className="space-y-2">

          {groups.map((group) => (
            <div
              key={group.id}
              className="border rounded-lg p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {group.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {group.parentId
                    ? "Nhóm con"
                    : "Nhóm gốc"}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setParentId(group.id);

                  alert(
                    "Đang tạo nhóm con của: " +
                      group.name
                  );
                }}
              >
                Tạo nhóm con
              </Button>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Tìm từ vựng</CardTitle>
      </CardHeader>

      <CardContent>

        <Input
          placeholder="Nhập từ..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Danh sách từ</CardTitle>
      </CardHeader>

      <CardContent>

        <div className="space-y-2 max-h-[400px] overflow-auto">

          {filteredWords.map((word) => (
            <label
              key={word.id}
              className="border rounded-lg p-3 flex gap-3"
            >
              <input
                type="checkbox"
                checked={selectedWords.includes(
                  word.id
                )}
                onChange={() =>
                  toggleWord(word.id)
                }
              />

              <div>
                <p className="font-medium">
                  {word.term}
                </p>

                <p className="text-sm text-muted-foreground">
                  {word.definition}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">

          <p>
            Đã chọn {selectedWords.length} từ
          </p>

          <Button
            className="mt-3"
            onClick={handleAddWords}
          >
            Thêm từ vào nhóm
          </Button>

        </div>

      </CardContent>
    </Card>

  </div>
</Layout>

);
}
