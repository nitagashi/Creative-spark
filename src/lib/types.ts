export type Category =
  | "Emotion"
  | "Behavior"
  | "Injury"
  | "Character Trait"
  | "Name"
  | "Setting"
  | "Object"
  | "Other";

export const CATEGORIES: Category[] = [
  "Emotion",
  "Behavior",
  "Injury",
  "Character Trait",
  "Name",
  "Setting",
  "Object",
  "Other",
];

export interface Entry {
  id: string;
  title: string;
  category: Category;
  customCategory?: string; // used when category === "Other"
  description: string; // HTML from tiptap
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export function displayCategory(e: { category: Category; customCategory?: string }): string {
  if (e.category === "Other" && e.customCategory && e.customCategory.trim()) {
    return e.customCategory.trim();
  }
  return e.category;
}
