import { useEffect, useState, useCallback } from "react";
import type { Entry } from "./types";
import { isBuiltinCategory } from "./types";

const KEY = "inkwell.entries.v1";
const CC_KEY = "inkwell.customCategories.v1";

function readCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(CC_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeCustomCategoriesRaw(list: string[]) {
  const unique = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
  localStorage.setItem(CC_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent("inkwell:cc-update"));
}

function migrateEntries(entries: Entry[]): {
  entries: Entry[];
  learned: string[];
  changed: boolean;
} {
  const learned: string[] = [];
  let changed = false;
  const out = entries.map((e) => {
    if (e.category === "Other" && e.customCategory && e.customCategory.trim()) {
      const name = e.customCategory.trim();
      learned.push(name);
      changed = true;
      return { ...e, category: name, customCategory: undefined };
    }
    if (!isBuiltinCategory(e.category) && e.category !== "Other") {
      learned.push(e.category);
    }
    return e;
  });
  return { entries: out, learned, changed };
}

function readAll(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed: Entry[] = JSON.parse(raw);
    const { entries, learned, changed } = migrateEntries(parsed);
    if (learned.length) {
      const merged = Array.from(
        new Set([...readCustomCategories(), ...learned]),
      );
      writeCustomCategoriesRaw(merged);
    }
    if (changed) localStorage.setItem(KEY, JSON.stringify(entries));
    return entries;
  } catch {
    return [];
  }
}

function writeAll(entries: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("inkwell:update"));
}

export function useCustomCategories() {
  const [list, setList] = useState<string[]>(() => readCustomCategories());

  useEffect(() => {
    const handler = () => setList(readCustomCategories());
    window.addEventListener("inkwell:cc-update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("inkwell:cc-update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    const current = readCustomCategories();
    if (current.some((c) => c.toLowerCase() === n.toLowerCase())) return;
    writeCustomCategoriesRaw([...current, n]);
  }, []);

  const remove = useCallback((name: string) => {
    writeCustomCategoriesRaw(readCustomCategories().filter((c) => c !== name));
  }, []);

  return {
    customCategories: list,
    addCustomCategory: add,
    removeCustomCategory: remove,
  };
}

function seed(): Entry[] {
  const now = Date.now();
  const seedData: Entry[] = [
    {
      id: crypto.randomUUID(),
      title: "Cold Anger",
      category: "Emotion",
      description:
        "<p>A still, deliberate fury. The kind that doesn't shout — it <em>plans</em>. Jaw tight, breath measured, gaze steady. The room feels colder when she enters it.</p><p>Use sparingly: when restraint frightens more than rage.</p>",
      tags: ["restrained", "villain", "tension"],
      favorite: true,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
    },
    {
      id: crypto.randomUUID(),
      title: "Broken Rib",
      category: "Injury",
      description:
        "<p>Sharp inward stab with every breath. Coughing is a small betrayal. Movement is negotiated rather than performed.</p><p>Healing: 4–6 weeks. Sleep is shallow; lying flat is impossible.</p>",
      tags: ["physical", "recovery"],
      favorite: false,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: crypto.randomUUID(),
      title: "Quiet Tenderness",
      category: "Behavior",
      description:
        "<p>The way he straightens her collar without meeting her eyes. A thumb brushed across a knuckle. Saying nothing, then saying her name.</p>",
      tags: ["romance", "subtle"],
      favorite: true,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    },
    {
      id: crypto.randomUUID(),
      title: "Iseult",
      category: "Name",
      description:
        "<p>Old Celtic origin — meaning <em>beautiful one</em>. Suits a heroine with sea-grey eyes and a stubborn streak.</p>",
      tags: ["female", "celtic"],
      favorite: false,
      createdAt: now - 86400000 * 8,
      updatedAt: now - 86400000 * 8,
    },
  ];
  localStorage.setItem(KEY, JSON.stringify(seedData));
  return seedData;
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => readAll());

  useEffect(() => {
    const handler = () => setEntries(readAll());
    window.addEventListener("inkwell:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("inkwell:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const upsert = useCallback((entry: Entry) => {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);
    writeAll(all);
  }, []);

  const remove = useCallback((id: string) => {
    writeAll(readAll().filter((e) => e.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        favorite: !all[idx].favorite,
        updatedAt: Date.now(),
      };
      writeAll(all);
    }
  }, []);

  const importEntries = useCallback(
    (
      incoming: Entry[],
      mode: "merge" | "replace",
    ): { added: number; updated: number; total: number } => {
      const existing = mode === "replace" ? [] : readAll();
      const map = new Map(existing.map((e) => [e.id, e]));
      let added = 0;
      let updated = 0;
      for (const entry of incoming) {
        if (map.has(entry.id)) {
          updated++;
        } else {
          added++;
        }
        map.set(entry.id, entry);
      }
      const merged = Array.from(map.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      writeAll(merged);
      return { added, updated, total: merged.length };
    },
    [],
  );

  return { entries, upsert, remove, toggleFavorite, importEntries };
}

export function validateEntries(data: unknown): Entry[] | null {
  if (!Array.isArray(data)) return null;
  const valid: Entry[] = [];
  for (const item of data) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as Entry).id !== "string" ||
      typeof (item as Entry).title !== "string" ||
      typeof (item as Entry).category !== "string" ||
      typeof (item as Entry).description !== "string" ||
      !Array.isArray((item as Entry).tags)
    ) {
      return null;
    }
    const e = item as Entry;
    valid.push({
      id: e.id,
      title: e.title,
      category: e.category,
      customCategory:
        typeof e.customCategory === "string" ? e.customCategory : undefined,
      description: e.description,
      tags: e.tags.map(String),
      favorite: !!e.favorite,
      createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
      updatedAt: typeof e.updatedAt === "number" ? e.updatedAt : Date.now(),
    });
  }
  return valid;
}

export function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
