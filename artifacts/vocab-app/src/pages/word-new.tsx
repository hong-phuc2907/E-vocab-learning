import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";
import {
  createWord,
  findDuplicate,
  listWords,
  listGroups,
  type Word,
  type Group,
} from "@/lib/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent } from "@/components/ui/card";

import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Copy,
  Check,
  Search,
} from "lucide-react";

import { Link } from "wouter";

const POS_OPTIONS = [
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "idiom", label: "Thành ngữ" },
  { value: "phrase", label: "Cụm từ" },
];

export default function WordNew() {
  const { user } = useAuth();

  const [isPending, setIsPending] =
    useState(false);

  const [allWords, setAllWords] =
    useState<Word[]>([]);

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [groupSearch, setGroupSearch] =
    useState("");

  const [selectedGroups, setSelectedGroups] =
    useState<string[]>([]);

  const [duplicate, setDuplicate] =
    useState<Word | null>(null);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [form, setForm] = useState({
    term: "",
    definition: "",
    pronunciation: "",
    example: "",
    category: "",
    partOfSpeech: "",
    difficulty: "medium" as
      | "easy"
      | "medium"
      | "hard",
  });

  useEffect(() => {
    if (!user) return;

    Promise.all([
      listWords(user.uid),
      listGroups(user.uid),
    ]).then(([words, groups]) => {
      setAllWords(words);
      setGroups(groups);
    });
  }, [user]);

  const setField =
    (key: keyof typeof form) =>
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const parsePos = (
    value: string
  ): string[] => {
    if (!value) return [];

    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const togglePos = (
    pos: string
  ) => {
    const current =
      parsePos(form.partOfSpeech);

    let next: string[];

    if (current.includes(pos)) {
      next = current.filter(
        (x) => x !== pos
      );
    } else {
      next = [...current, pos];
    }

    setForm((prev) => ({
      ...prev,
      partOfSpeech:
        next.join(", "),
    }));
  };

  const copyWordData = (
    wordId: string
  ) => {
    const word =
      allWords.find(
        (w) => w.id === wordId
      );

    if (!word) return;

    setForm((prev) => ({
      ...prev,
      definition:
        word.definition || "",
      pronunciation:
        word.pronunciation || "",
      example:
        word.example || "",
      category:
        word.category || "",
      difficulty:
        word.difficulty ||
        "medium",
      partOfSpeech:
        word.partOfSpeech || "",
    }));

    setSearchQuery("");
  };

  const filteredWords =
    allWords.filter((word) => {
      const q =
        searchQuery.toLowerCase();

      return (
        word.term
          .toLowerCase()
          .includes(q) ||
        word.definition
          .toLowerCase()
          .includes(q)
      );
    });

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (!user) return;

      setErrors({});
      setDuplicate(null);

      const err: Record<
        string,
        string
      > = {};

      if (!form.term.trim()) {
        err.term =
          "Vui lòng nhập từ";
      }

      if (
        !form.definition.trim()
      ) {
        err.definition =
          "Vui lòng nhập nghĩa";
      }

      if (
        Object.keys(err)
          .length > 0
      ) {
        setErrors(err);
        return;
      }

      setIsPending(true);

      try {
        const payload = {
          term: form.term.trim(),
          definition:
            form.definition.trim(),
          pronunciation:
            form.pronunciation.trim(),
          example:
            form.example.trim(),
          category:
            form.category.trim(),
          partOfSpeech:
            form.partOfSpeech,
          difficulty:
            form.difficulty,
          groupIds:
            selectedGroups,
        };

        const dup =
          await findDuplicate(
            user.uid,
            payload
          );

        if (dup) {
          setDuplicate(dup);
          setIsPending(false);
          return;
        }

        await createWord(
          user.uid,
          payload
        );

        window.location.href =
          "/words";
      } catch (error) {
        setErrors({
          submit:
            "Không thể lưu dữ liệu",
        });
      }

      setIsPending(false);
    };
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 p-4">

        <div className="flex items-center justify-between">
          <Link href="/words">
            <Button
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>

          <h1 className="text-2xl font-bold">
            Thêm từ vựng
          </h1>
        </div>

        {allWords.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-3">

              <Label>
                Tìm từ đã có để sao chép
              </Label>

              <Input
                placeholder="Tìm từ..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
              />

              {searchQuery.trim() && (
                <div className="border rounded-lg max-h-48 overflow-auto">

                  {filteredWords.length ===
                  0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Không tìm thấy
                    </div>
                  ) : (
                    filteredWords.map(
                      (word) => (
                        <div
                          key={word.id}
                          className="flex items-center justify-between p-3 border-b"
                        >
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

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              copyWordData(
                                word.id
                              )
                            }
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Sao chép
                          </Button>
                        </div>
                      )
                    )
                  )}

                </div>
              )}

            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >

              <div>
                <Label>Từ *</Label>

                <Input
                  value={form.term}
                  onChange={(e) =>
                    setField(
                      "term"
                    )(
                      e.target.value
                    )
                  }
                  placeholder="English word"
                />

                {errors.term && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.term}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Phiên âm
                </Label>

                <Input
                  value={
                    form.pronunciation
                  }
                  onChange={(e) =>
                    setField(
                      "pronunciation"
                    )(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <Label>
                  Từ loại
                </Label>

                <div className="flex flex-wrap gap-2 mt-2">
                  {POS_OPTIONS.map(
                    (pos) => {
                      const selected =
                        parsePos(
                          form.partOfSpeech
                        ).includes(
                          pos.value
                        );

                      return (
                        <button
                          key={
                            pos.value
                          }
                          type="button"
                          onClick={() =>
                            togglePos(
                              pos.value
                            )
                          }
                          className={`px-3 py-2 rounded-lg border text-sm ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          {selected && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}

                          {
                            pos.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <Label>
                  Nghĩa *
                </Label>

                <Textarea
                  value={
                    form.definition
                  }
                  onChange={(e) =>
                    setField(
                      "definition"
                    )(
                      e.target.value
                    )
                  }
                  rows={4}
                />

                {errors.definition && (
                  <p className="text-sm text-destructive mt-1">
                    {
                      errors.definition
                    }
                  </p>
                )}
              </div>
              <div>
                <Label>
                  Ví dụ
                </Label>

                <Textarea
                  value={
                    form.example
                  }
                  onChange={(e) =>
                    setField(
                      "example"
                    )(
                      e.target.value
                    )
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label>
                  Chủ đề
                </Label>

                <Input
                  value={
                    form.category
                  }
                  onChange={(e) =>
                    setField(
                      "category"
                    )(
                      e.target.value
                    )
                  }
                  placeholder="IELTS, Business..."
                />
              </div>

              <div>
                <Label>
                  Độ khó
                </Label>

                <Select
                  value={
                    form.difficulty
                  }
                  onValueChange={(
                    value
                  ) =>
                    setField(
                      "difficulty"
                    )(
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="easy">
                      Dễ
                    </SelectItem>

                    <SelectItem value="medium">
                      Trung bình
                    </SelectItem>

                    <SelectItem value="hard">
                      Khó
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  Nhóm từ vựng
                </Label>

                <Input
                  placeholder="Tìm nhóm..."
                  value={
                    groupSearch
                  }
                  onChange={(e) =>
                    setGroupSearch(
                      e.target.value
                    )
                  }
                />

                <div className="border rounded-lg mt-3 p-2 max-h-48 overflow-auto">

                  {groups
                    .filter((g) =>
                      g.name
                        .toLowerCase()
                        .includes(
                          groupSearch.toLowerCase()
                        )
                    )
                    .map(
                      (group) => (
                        <label
                          key={
                            group.id
                          }
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(
                              group.id
                            )}
                            onChange={() => {
                              if (
                                selectedGroups.includes(
                                  group.id
                                )
                              ) {
                                setSelectedGroups(
                                  selectedGroups.filter(
                                    (
                                      x
                                    ) =>
                                      x !==
                                      group.id
                                  )
                                );
                              } else {
                                setSelectedGroups(
                                  [
                                    ...selectedGroups,
                                    group.id,
                                  ]
                                );
                              }
                            }}
                          />

                          <span>
                            {
                              group.name
                            }
                          </span>
                        </label>
                      )
                    )}

                </div>

                {selectedGroups.length >
                  0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Đã chọn{" "}
                    {
                      selectedGroups.length
                    }{" "}
                    nhóm
                  </p>
                )}
              </div>

              {duplicate && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  Từ này đã tồn tại:
                  <br />
                  <strong>
                    {
                      duplicate.term
                    }
                  </strong>
                </div>
              )}

              {errors.submit && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {
                    errors.submit
                  }
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">

                <Link href="/words">
                  <Button
                    type="button"
                    variant="ghost"
                  >
                    Hủy
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={
                    isPending
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />

                  {isPending
                    ? "Đang lưu..."
                    : "Thêm từ"}
                </Button>

              </div>

            </form>

          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
