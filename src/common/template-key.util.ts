/** Согласовано с фронтом (`bulk-catalog.ts`): кириллица → латиница, затем только a-z, 0-9, _, -. */

const RU_MAP: Record<string, string> = {
  А: "a",
  а: "a",
  Б: "b",
  б: "b",
  В: "v",
  в: "v",
  Г: "g",
  г: "g",
  Д: "d",
  д: "d",
  Е: "e",
  е: "e",
  Ё: "yo",
  ё: "yo",
  Ж: "zh",
  ж: "zh",
  З: "z",
  з: "z",
  И: "i",
  и: "i",
  Й: "y",
  й: "y",
  К: "k",
  к: "k",
  Л: "l",
  л: "l",
  М: "m",
  м: "m",
  Н: "n",
  н: "n",
  О: "o",
  о: "o",
  П: "p",
  п: "p",
  Р: "r",
  р: "r",
  С: "s",
  с: "s",
  Т: "t",
  т: "t",
  У: "u",
  у: "u",
  Ф: "f",
  ф: "f",
  Х: "h",
  х: "h",
  Ц: "ts",
  ц: "ts",
  Ч: "ch",
  ч: "ch",
  Ш: "sh",
  ш: "sh",
  Щ: "shch",
  щ: "shch",
  Ъ: "",
  ъ: "",
  Ы: "y",
  ы: "y",
  Ь: "",
  ь: "",
  Э: "e",
  э: "e",
  Ю: "yu",
  ю: "yu",
  Я: "ya",
  я: "ya"
};

export function transliterateRu(s: string): string {
  let out = "";
  for (const ch of s) {
    out += RU_MAP[ch] ?? ch;
  }
  return out;
}

/** Ключ для URL и коллекции `entity_templates` / каталога: только латиница, цифры, `_`, `-`. */
export function canonicalTemplateKey(raw: string): string {
  const t = transliterateRu(raw.trim());
  const slug = t
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const base = slug.length > 0 ? slug : "item";
  return base.length > 100 ? base.slice(0, 100) : base;
}
