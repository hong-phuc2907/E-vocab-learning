import { useState } from "react";
import { Layout } from "@/components/layout";
import { useCreateWord, getListWordsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function WordNew() {
  const [, navigate] = useLocation();
  const createWord = useCreateWord();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    term: "",
    definition: "",
    partOfSpeech: "",
    example: "",
    pronunciation: "",
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.term.trim()) newErrors.term = "Term is required";
    if (!form.definition.trim()) newErrors.definition = "Definition is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data: Record<string, string> = {
      term: form.term.trim(),
      definition: form.definition.trim(),
      difficulty: form.difficulty,
    };
    if (form.partOfSpeech) data.partOfSpeech = form.partOfSpeech;
    if (form.example) data.example = form.example;
    if (form.pronunciation) data.pronunciation = form.pronunciation;
    if (form.category) data.category = form.category;

    await createWord.mutateAsync({ data: data as any });
    queryClient.invalidateQueries({ queryKey: getListWordsQueryKey() });
    navigate("/words");
  };

  return (
    <Layout>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="-ml-2">
            <Link href="/words"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-serif font-bold">Add a New Word</h1>
          <p className="text-muted-foreground mt-1">Expand your vocabulary one word at a time.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="term">Word or Phrase <span className="text-destructive">*</span></Label>
                <Input
                  id="term"
                  value={form.term}
                  onChange={(e) => set("term")(e.target.value)}
                  placeholder="e.g. ephemeral"
                  className={errors.term ? "border-destructive" : ""}
                />
                {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pronunciation">Pronunciation</Label>
                <Input
                  id="pronunciation"
                  value={form.pronunciation}
                  onChange={(e) => set("pronunciation")(e.target.value)}
                  placeholder="e.g. /ɪˈfem.ər.əl/"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="definition">Definition <span className="text-destructive">*</span></Label>
                <Textarea
                  id="definition"
                  value={form.definition}
                  onChange={(e) => set("definition")(e.target.value)}
                  placeholder="What does it mean?"
                  rows={3}
                  className={errors.definition ? "border-destructive" : ""}
                />
                {errors.definition && <p className="text-xs text-destructive">{errors.definition}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="example">Example Sentence</Label>
                <Textarea
                  id="example"
                  value={form.example}
                  onChange={(e) => set("example")(e.target.value)}
                  placeholder="Use it in a sentence..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Part of Speech</Label>
                  <Select value={form.partOfSpeech} onValueChange={set("partOfSpeech")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Noun</SelectItem>
                      <SelectItem value="verb">Verb</SelectItem>
                      <SelectItem value="adjective">Adjective</SelectItem>
                      <SelectItem value="adverb">Adverb</SelectItem>
                      <SelectItem value="preposition">Preposition</SelectItem>
                      <SelectItem value="conjunction">Conjunction</SelectItem>
                      <SelectItem value="pronoun">Pronoun</SelectItem>
                      <SelectItem value="interjection">Interjection</SelectItem>
                      <SelectItem value="phrase">Phrase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => set("difficulty")(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category / List</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category")(e.target.value)}
                  placeholder="e.g. SAT Prep, Science, Daily Life..."
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full mt-4"
            size="lg"
            disabled={createWord.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            {createWord.isPending ? "Adding..." : "Add Word"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
