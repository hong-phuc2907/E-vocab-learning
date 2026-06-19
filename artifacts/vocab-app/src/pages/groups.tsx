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

const [groups, setGroups] =
useState<Group[]>([]);

const [words, setWords] =
useState<Word[]>([]);

const [groupName, setGroupName] =
useState("");

const [parentId, setParentId] =
useState<string | null>(null);

async function loadData() {
if (!user) return;

const [g, w] =
  await Promise.all([
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
if (
!user ||
!groupName.trim()
)
return;

await createGroup(
  user.uid,
  groupName,
  parentId
);

setGroupName("");
setParentId(null);

loadData();

}
const [search, setSearch] =
useState("");

const filteredWords =
words.filter((w) =>
(
w.term +
" " +
w.definition +
" " +
(w.synonyms ?? [])
.join(" ")
)
.toLowerCase()
.includes(
search.toLowerCase()
)
);

const [selectedWords,
setSelectedWords] =
useState<string[]>([]);

function toggleWord(
id: string
) {
setSelectedWords(
(prev) =>
prev.includes(id)
? prev.filter(
(x) =>
x !== id
)
: [
...prev,
id,
]
);
}

return (
<Layout>
<div className="space-y-6">

    <Card>
      <CardHeader>
        <CardTitle>
          Tạo nhóm từ
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

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
          onClick={
            handleCreateGroup
          }
        >
          Tạo nhóm
        </Button>

      </CardContent>
    </Card>
  <Card>
          <CardHeader>
            <CardTitle>
              Danh sách nhóm
            </CardTitle>
          </CardHeader>      <CardContent>

        <div className="space-y-2">

          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Chưa có nhóm nào
            </p>
          )}

          {groups.map(
            (group) => (
              <div
                key={group.id}
                className="border rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">
                    {group.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    ID:
                    {" "}
                    {group.id}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setParentId(
                      group.id
                    )
                  }
                >
                  Tạo nhóm con
                </Button>

              </div>
            )
          )}

        </div>

      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>
          Tìm từ vựng
        </CardTitle>
      </CardHeader>

      <CardContent>

        <Input
          placeholder="Nhập tiếng Anh hoặc tiếng Việt..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

      </CardContent>
    </Card>
  <Card>
          <CardHeader>
            <CardTitle>
              Kết quả tìm kiếm
            </CardTitle>
          </CardHeader>      <CardContent>

        <div className="space-y-2 max-h-[500px] overflow-auto">

          {filteredWords.map(
            (word) => (
              <label
                key={word.id}
                className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
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

                <div className="flex-1">

                  <p className="font-medium">
                    {word.term}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {word.definition}
                  </p>

                  {(word.synonyms ??
                    []).length >
                    0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Synonyms:
                      {" "}
                      {word.synonyms?.join(
                        ", "
                      )}
                    </p>
                  )}

                </div>
              </label>
            )
          )}

        </div>

        <div className="mt-4 border-t pt-4">

          <p className="text-sm font-medium">
            Đã chọn:
            {" "}
            {selectedWords.length}
            {" "}
            từ
          </p>

        </div>

      </CardContent>
    </Card>

  </div>
</Layout>

);
}
