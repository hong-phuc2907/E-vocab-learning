import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
createGroup,
listGroups,
listWords,
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

try {
  const g = await listGroups(user.uid);
  const w = await listWords(user.uid);

  setGroups(g);
  setWords(w);
} catch (err) {
  console.error(err);
}

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
        <div className="space-y-2">

          {groups.length === 0 && (
            <p>Chưa có nhóm nào</p>
          )}

          {groups.map((group) => (
            <div
              key={group.id}
              className="border rounded-lg p-3 flex justify-between"
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
                onClick={() =>
                  setParentId(group.id)
                }
              >
                Nhóm con
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
          placeholder="Nhập tiếng Anh hoặc tiếng Việt"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Kết quả</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-auto">

          {filteredWords.map((word) => (
            <label
              key={word.id}
              className="border rounded-lg p-3 flex gap-3 cursor-pointer"
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

                {(word.synonyms ?? []).length >
                  0 && (
                  <p className="text-xs text-blue-600">
                    {word.synonyms?.join(", ")}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4">
          Đã chọn: {selectedWords.length} từ
        </div>
      </CardContent>
    </Card>

  </div>
</Layout>

);
                  }
