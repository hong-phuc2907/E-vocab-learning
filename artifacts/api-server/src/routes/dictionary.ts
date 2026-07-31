import { Router } from "express";

const router = Router();

/* =====================================================
                    TYPES
===================================================== */

interface Meaning {
  partOfSpeech: string;
  definitions: string[];
}

interface DictionaryResult {
  word: string;

  phonetic: string;

  audio: string;

  origin: string;

  meanings: Meaning[];

  examples: string[];

  synonyms: string[];

  antonyms: string[];

  collocations: string[];

  family: string[];
}

/* =====================================================
                    CACHE
===================================================== */

const CACHE_TIME = 1000 * 60 * 60;

const cache = new Map<
  string,
  {
    expires: number;
    data: DictionaryResult;
  }
>();

function getCache(
  word: string
): DictionaryResult | null {

  const item = cache.get(word);

  if (!item) return null;

  if (Date.now() > item.expires) {

    cache.delete(word);

    return null;

  }

  return item.data;

}

function saveCache(
  word: string,
  data: DictionaryResult
) {

  cache.set(word, {

    expires:
      Date.now() +
      CACHE_TIME,

    data,

  });

}

/* =====================================================
                    HELPERS
===================================================== */

function unique<T>(
  arr: T[]
): T[] {

  return [...new Set(arr)];

}

function cleanWord(
  word: string
) {

  return word
    .trim()
    .toLowerCase();

}

async function fetchJSON<T>(
  url: string
): Promise<T | null> {

  try {

    const res = await fetch(url);

    if (!res.ok)
      return null;

    return await res.json();

  } catch {

    return null;

  }

}

/* =====================================================
          FREE DICTIONARY API
===================================================== */

async function queryDictionaryAPI(
  word: string
) {

  const data =
    await fetchJSON<any[]>(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );

  if (!data)
    return null;

  const entry = data[0];

  const phonetic =
    entry.phonetic ??
    "";

  let audio = "";

  if (
    Array.isArray(
      entry.phonetics
    )
  ) {

    for (const p of entry.phonetics) {

      if (
        p.audio &&
        p.audio.length
      ) {

        audio = p.audio;

        break;

      }

    }

  }

  const meanings: Meaning[] =
    [];

  const examples: string[] =
    [];

  const synonyms: string[] =
    [];

  const antonyms: string[] =
    [];

  for (const m of entry.meanings) {

    const defs: string[] =
      [];

    for (const d of m.definitions) {

      defs.push(
        d.definition
      );

      if (d.example)
        examples.push(
          d.example
        );

      if (d.synonyms)
        synonyms.push(
          ...d.synonyms
        );

      if (d.antonyms)
        antonyms.push(
          ...d.antonyms
        );

    }

    meanings.push({

      partOfSpeech:
        m.partOfSpeech,

      definitions:
        defs,

    });

  }

  return {

    word:
      entry.word,

    phonetic,

    audio,

    origin:
      entry.origin ??
      "",

    meanings,

    examples,

    synonyms,

    antonyms,

  };

}
/* =====================================================
                DATAMUSE API
===================================================== */

async function queryDatamuse(
  word: string
) {

  const [

    synonymData,

    antonymData,

    collocationData,

    familyData,

  ] = await Promise.all([

    fetchJSON<any[]>(
      `https://api.datamuse.com/words?rel_syn=${word}&max=25`
    ),

    fetchJSON<any[]>(
      `https://api.datamuse.com/words?rel_ant=${word}&max=25`
    ),

    fetchJSON<any[]>(
      `https://api.datamuse.com/words?rel_trg=${word}&max=25`
    ),

    fetchJSON<any[]>(
      `https://api.datamuse.com/words?sp=${word}*&max=25`
    ),

  ]);

  return {

    synonyms:
      synonymData?.map(
        (x) => x.word
      ) ?? [],

    antonyms:
      antonymData?.map(
        (x) => x.word
      ) ?? [],

    collocations:
      collocationData?.map(
        (x) => x.word
      ) ?? [],

    family:
      familyData?.map(
        (x) => x.word
      ) ?? [],

  };

}

/* =====================================================
                WIKTIONARY
===================================================== */

async function queryWiki(
  word: string
) {

  const wiki =
    await fetchJSON<any>(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`
    );

  if (!wiki)
    return {

      origin: "",

      examples: [],

    };

  const origin: string[] =
    [];

  const examples: string[] =
    [];

  try {

    for (const lang in wiki) {

      const arr = wiki[lang];

      for (const item of arr) {

        if (
          item.etymology
        ) {

          origin.push(
            item.etymology
          );

        }

        if (
          item.definitions
        ) {

          for (const def of item.definitions) {

            if (
              def.examples
            ) {

              examples.push(
                ...def.examples
              );

            }

          }

        }

      }

    }

  } catch {}

  return {

    origin:
      origin.join("\n"),

    examples,

  };

}
/* =====================================================
                    SEARCH
===================================================== */

async function searchDictionary(
  input: string
): Promise<DictionaryResult | null> {

  const word =
    cleanWord(input);

  const cached =
    getCache(word);

  if (cached)
    return cached;

  const [

    dictionary,

    datamuse,

    wiki,

  ] = await Promise.all([

    queryDictionaryAPI(word),

    queryDatamuse(word),

    queryWiki(word),

  ]);

  if (!dictionary)
    return null;

  const result: DictionaryResult = {

    word,

    phonetic:
      dictionary.phonetic,

    audio:
      dictionary.audio,

    origin:
      wiki.origin ||
      dictionary.origin,

    meanings:
      dictionary.meanings,

    examples:
      unique([

        ...dictionary.examples,

        ...wiki.examples,

      ]),

    synonyms:
      unique([

        ...dictionary.synonyms,

        ...datamuse.synonyms,

      ]),

    antonyms:
      unique([

        ...dictionary.antonyms,

        ...datamuse.antonyms,

      ]),

    collocations:
      unique(
        datamuse.collocations
      ),

    family:
      unique(
        datamuse.family
      ),

  };

  saveCache(
    word,
    result
  );

  return result;

}

/* =====================================================
                    ROUTE
===================================================== */

router.get(
  "/dictionary/:word",
  async (req, res) => {

    try {

      const word =
        req.params.word;

      if (!word) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Missing word",

          });

      }

      const result =
        await searchDictionary(
          word
        );

      if (!result) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Word not found",

          });

      }

      return res.json({

        success: true,

        data: result,

      });

    } catch (err) {

      console.error(err);

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Internal Server Error",

        });

    }

  }
);

export default router;
