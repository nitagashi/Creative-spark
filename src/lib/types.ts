export type Category = string;

export const BUILTIN_CATEGORIES = [
  "Emotion",
  "Behavior",
  "Injury",
  "Character Trait",
  "Name",
  "Setting",
  "Object",
] as const;

// Kept for backward-compat with older code paths
export const CATEGORIES: Category[] = [...BUILTIN_CATEGORIES];

export function isBuiltinCategory(c: string): boolean {
  return (BUILTIN_CATEGORIES as readonly string[]).includes(c);
}

export interface Entry {
  id: string;
  title: string;
  category: Category;
  customCategory?: string; // legacy: used when category === "Other"
  description: string; // HTML from tiptap
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export function displayCategory(e: {
  category: Category;
  customCategory?: string;
}): string {
  if (e.category === "Other" && e.customCategory && e.customCategory.trim()) {
    return e.customCategory.trim();
  }
  return e.category;
}
