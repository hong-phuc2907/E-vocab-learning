import { useState } from "react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  BookOpen,
  Brain,
  Sparkles,
} from "lucide-react";

const mockData = {
  word: "beautiful",
  ipa: "/ˈbjuː.tɪ.fəl/",
  level: "A1",
  partOfSpeech: "Adjective",

  meanings: [
    "đẹp",
    "xinh đẹp",
    "tuyệt đẹp",
  ],

  definition:
    "Pleasing the senses or mind aesthetically.",

  examples: [
    {
      en: "She is beautiful.",
      vi: "Cô ấy rất đẹp.",
    },
    {
      en: "The sunset is beautiful.",
      vi: "Hoàng hôn thật đẹp.",
    },
  ],

  synonyms: [
    "pretty",
    "lovely",
    "gorgeous",
    "stunning",
    "attractive",
  ],

  antonyms: [
    "ugly",
    "plain",
    "unattractive",
  ],

  family: [
    "beauty",
    "beautifully",
    "beautify",
  ],

  collocations: [
    "beautiful girl",
    "beautiful city",
    "beautiful view",
    "beautiful voice",
  ],

  mistakes: [
    {
      wrong: "very beauty",
      right: "very beautiful",
    },
  ],

  tip:
    "Hãy nhớ 'beauty' là vẻ đẹp. beautiful là có vẻ đẹp.",

  frequency: 5,
};

export default function Dictionary() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<any>(null);

  function searchWord() {
    if (!keyword.trim()) return;

    // Sau này thay bằng Gemini API
    setResult(mockData);
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold">
          🤖 AI Dictionary
        </h1>

        <div className="flex gap-3">

          <Input
            value={keyword}
            placeholder="Nhập từ tiếng Anh..."
            onChange={(e)=>setKeyword(e.target.value)}
            onKeyDown={(e)=>{
              if(e.key==="Enter") searchWord();
            }}
          />

          <Button onClick={searchWord}>
            <Search className="w-4 h-4 mr-2"/>
            Search
          </Button>

        </div>

        {result && (

          <div className="rounded-3xl border bg-card p-8 space-y-8">

            <div>

              <h2 className="text-5xl font-bold">
                {result.word}
              </h2>

              <p className="mt-2 text-muted-foreground">
                {result.ipa}
              </p>

              <div className="flex gap-2 mt-4">

                <Badge>
                  {result.partOfSpeech}
                </Badge>

                <Badge variant="outline">
                  {result.level}
                </Badge>

              </div>

            </div>

            <section>

              <h3 className="font-bold text-xl mb-3">
                🇻🇳 Nghĩa
              </h3>

              <ul className="space-y-2">

                {result.meanings.map((x:string)=>(
                  <li key={x}>
                    • {x}
                  </li>
                ))}

              </ul>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                📖 Định nghĩa
              </h3>

              <p>{result.definition}</p>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                💬 Ví dụ
              </h3>

              <div className="space-y-4">

                {result.examples.map((e:any)=>(
                  <div
                    key={e.en}
                    className="rounded-xl bg-muted p-4"
                  >
                    <p className="font-medium">
                      {e.en}
                    </p>

                    <p className="text-muted-foreground mt-1">
                      {e.vi}
                    </p>

                  </div>
                ))}

              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                ⭐ Đồng nghĩa
              </h3>

              <div className="flex flex-wrap gap-2">

                {result.synonyms.map((x:string)=>(
                  <Badge key={x} variant="secondary">
                    {x}
                  </Badge>
                ))}

              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                ❌ Trái nghĩa
              </h3>

              <div className="flex flex-wrap gap-2">

                {result.antonyms.map((x:string)=>(
                  <Badge key={x} variant="outline">
                    {x}
                  </Badge>
                ))}

              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                👨‍👩‍👧 Word Family
              </h3>

              <div className="flex flex-wrap gap-2">

                {result.family.map((x:string)=>(
                  <Badge key={x}>
                    {x}
                  </Badge>
                ))}

              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                📌 Collocations
              </h3>

              <div className="flex flex-wrap gap-2">

                {result.collocations.map((x:string)=>(
                  <Badge
                    key={x}
                    variant="secondary"
                  >
                    {x}
                  </Badge>
                ))}

              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                💡 Memory Tip
              </h3>

              <div className="rounded-xl bg-primary/10 p-4">
                {result.tip}
              </div>

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                ⚠ Common Mistakes
              </h3>

              {result.mistakes.map((m:any)=>(
                <div
                  key={m.wrong}
                  className="rounded-xl border p-4"
                >
                  <p className="text-red-500">
                    ❌ {m.wrong}
                  </p>

                  <p className="text-green-600">
                    ✅ {m.right}
                  </p>

                </div>
              ))}

            </section>

            <section>

              <h3 className="font-bold text-xl mb-3">
                📈 Frequency
              </h3>

              <div className="flex gap-1">

                {Array.from({length:5}).map((_,i)=>(
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i<result.frequency
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                    }`}
                  />
                ))}

              </div>

            </section>

            <div className="flex flex-wrap gap-3 pt-4">

              <Button>
                <BookOpen className="w-4 h-4 mr-2"/>
                Thêm vào từ vựng
              </Button>

              <Button variant="outline">
                <Brain className="w-4 h-4 mr-2"/>
                Flashcard
              </Button>

              <Button variant="outline">
                <Sparkles className="w-4 h-4 mr-2"/>
                Hỏi AI
              </Button>

            </div>

          </div>

        )}

      </div>
    </Layout>
  );
}
