import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth-context";

import {
  getWord,
  updateWord,
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

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "wouter";

const POS_OPTIONS = [
  {
    value: "Noun",
    label: "Danh từ",
  },
  {
    value: "Verb",
    label: "Động từ",
  },
  {
    value: "Adjective",
    label: "Tính từ",
  },
  {
    value: "Adverb",
    label: "Trạng từ",
  },
  {
    value: "Idiom",
    label: "Thành ngữ",
  },
];

export default function WordEdit({
  id,
}: {
  id: string;
}) {
  const { user } = useAuth();

  const [, navigate] =
    useLocation();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [groupSearch, setGroupSearch] =
    useState("");

  const [selectedGroups, setSelectedGroups] =
    useState<string[]>([]);

  const [form, setForm] =
    useState({
      term: "",
      definition: "",
      partOfSpeech: "",
      example: "",
      pronunciation: "",
      category: "",
      difficulty:
        "medium" as
          | "easy"
          | "medium"
          | "hard",
    });

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const [
          word,
          groupList,
        ] = await Promise.all([
          getWord(
            user.uid,
            id
          ),
          listGroups(
            user.uid
          ),
        ]);

        if (!word) {
          navigate(
            "/words"
          );
          return;
        }

        setGroups(
          groupList
        );

        setSelectedGroups(
          word.groupIds ||
            []
        );

        setForm({
          term:
            word.term || "",
          definition:
            word.definition ||
            "",
          partOfSpeech:
            word.partOfSpeech ||
            "",
          example:
            word.example ||
            "",
          pronunciation:
            word.pronunciation ||
            "",
          category:
            word.category ||
            "",
          difficulty:
            word.difficulty ||
            "medium",
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    user,
    id,
    navigate,
  ]);

  const set =
    (
      key: keyof typeof form
    ) =>
    (
      value: any
    ) => {
      setForm(
        (
          prev
        ) => ({
          ...prev,
          [key]:
            value,
        })
      );
    };

  const parseParts =
    (
      value: any
    ): string[] => {
      if (!value)
        return [];

      if (
        Array.isArray(
          value
        )
      )
        return value;

      return value
        .split(",")
        .map(
          (
            x: string
          ) =>
            x.trim()
        )
        .filter(
          Boolean
        );
    };

  const togglePos =
    (
      value: string
    ) => {
      const current =
        parseParts(
          form.partOfSpeech
        );

      let next:
        string[] =
        [];

      if (
        current.includes(
          value
        )
      ) {
        next =
          current.filter(
            (
              x
            ) =>
              x !==
              value
          );
      } else {
        next = [
          ...current,
          value,
        ];
      }

      setForm(
        (
          prev
        ) => ({
          ...prev,
          partOfSpeech:
            next.join(
              ", "
            ),
        })
      );
    };
  async function handleSave() {
    if (!user) return;

    if (
      !form.term.trim() ||
      !form.definition.trim()
    ) {
      alert(
        "Vui lòng nhập từ và nghĩa"
      );
      return;
    }

    try {
      setSaving(true);

      await updateWord(
        user.uid,
        id,
        {
          term:
            form.term.trim(),
          definition:
            form.definition.trim(),
          partOfSpeech:
            form.partOfSpeech,
          example:
            form.example.trim(),
          pronunciation:
            form.pronunciation.trim(),
          category:
            form.category.trim(),
          difficulty:
            form.difficulty,
          groupIds:
            selectedGroups,
        }
      );

      navigate(
        `/words/${id}`
      );
    } catch (err) {
      console.error(
        err
      );

      alert(
        "Lưu thất bại"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          Đang tải...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">

          <Link
            href={`/words/${id}`}
          >
            <Button
              variant="ghost"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>

          <h1 className="text-2xl font-bold">
            Chỉnh sửa từ
          </h1>

        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">

            <div>
              <Label>
                Từ vựng
              </Label>

              <Input
                value={
                  form.term
                }
                onChange={(
                  e
                ) =>
                  set(
                    "term"
                  )(
                    e
                      .target
                      .value
                  )
                }
              />
            </div>

            <div>
              <Label>
                Nghĩa
              </Label>

              <Textarea
                value={
                  form.definition
                }
                onChange={(
                  e
                ) =>
                  set(
                    "definition"
                  )(
                    e
                      .target
                      .value
                  )
                }
              />
            </div>

            <div>
              <Label>
                Phiên âm
              </Label>

              <Input
                value={
                  form.pronunciation
                }
                onChange={(
                  e
                ) =>
                  set(
                    "pronunciation"
                  )(
                    e
                      .target
                      .value
                  )
                }
              />
            </div>

            <div>
              <Label>
                Ví dụ
              </Label>

              <Textarea
                value={
                  form.example
                }
                onChange={(
                  e
                ) =>
                  set(
                    "example"
                  )(
                    e
                      .target
                      .value
                  )
                }
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
                onChange={(
                  e
                ) =>
                  set(
                    "category"
                  )(
                    e
                      .target
                      .value
                  )
                }
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
                  v
                ) =>
                  set(
                    "difficulty"
                  )(
                    v
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
                Từ loại
              </Label>

              <div className="flex flex-wrap gap-2 mt-2">

                {POS_OPTIONS.map(
                  (
                    pos
                  ) => {
                    const selected =
                      parseParts(
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
                Nhóm từ vựng
              </Label>

              <Input
                placeholder="Tìm nhóm..."
                value={
                  groupSearch
                }
                onChange={(
                  e
                ) =>
                  setGroupSearch(
                    e
                      .target
                      .value
                  )
                }
              />

              <div className="border rounded-lg mt-2 p-2 max-h-40 overflow-auto">

                {groups
                  .filter(
                    (
                      g
                    ) =>
                      g.name
                        .toLowerCase()
                        .includes(
                          groupSearch.toLowerCase()
                        )
                  )
                  .map(
                    (
                      group
                    ) => (
                      <label
                        key={
                          group.id
                        }
                        className="flex gap-2 p-2 hover:bg-muted rounded cursor-pointer"
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
            </div>

            <Button
              onClick={
                handleSave
              }
              disabled={
                saving
              }
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />

              {saving
                ? "Đang lưu..."
                : "Lưu thay đổi"}
            </Button>

          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
