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
renameGroup,
deleteGroupSafe,
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

const [renameTarget, setRenameTarget] =
useState<Group | null>(null);

const [deleteTarget, setDeleteTarget] =
useState<Group | null>(null);

const [newName, setNewName] =
useState("");
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
} catch (error) {
  console.error(error);
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
    color: "#000000",
    icon: "",
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

async function handleRename() {
if (!user) return;
if (!renameTarget) return;

await renameGroup(
  user.uid,
  renameTarget.id,
  newName
);

setRenameTarget(null);
setNewName("");

load();

}

async function handleDelete() {
if (!user) return;
if (!deleteTarget) return;

await deleteGroupSafe(
  user.uid,
  deleteTarget.id
);

setDeleteTarget(null);

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
  {(children ?? []).map((g) => (

  <div
    key={g.id}
    className="border rounded-lg p-3 flex items-center justify-between w-full"
  >
    <Link
      href={`/groups/${g.id}`}
    >
      <div className="cursor-pointer">
        📁 {g.name}
      </div>
    </Link><div className="flex gap-2">

  <Link
    href={`/quiz?group=${g.id}`}
  >
    <Button size="sm">
      Kiểm tra
    </Button>
  </Link>

  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      setRenameTarget(g);
      setNewName(g.name);
    }}
  >
    Đổi tên
  </Button>

  <Button
    size="sm"
    variant="destructive"
    onClick={() =>
      setDeleteTarget(g)
    }
  >
    Xóa
  </Button>

</div>

  </div>
))}
