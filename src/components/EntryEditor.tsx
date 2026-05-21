import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichEditor } from "./RichEditor";
import { TagInput } from "./TagInput";
import { CATEGORIES, type Category, type Entry } from "@/lib/types";
import { useEntries } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: Entry | null;
  defaultCategory?: Category;
}

export function EntryEditor({ open, onOpenChange, entry, defaultCategory }: Props) {
  const { entries, upsert } = useEntries();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Emotion");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();
  const customCategorySuggestions = Array.from(
    new Set(
      entries
        .filter((e) => e.category === "Other" && e.customCategory)
        .map((e) => e.customCategory!.trim())
        .filter(Boolean)
    )
  ).sort();

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setCategory(entry?.category ?? defaultCategory ?? "Emotion");
      setCustomCategory(entry?.customCategory ?? "");
      setDescription(entry?.description ?? "");
      setTags(entry?.tags ?? []);
    }
  }, [open, entry, defaultCategory]);

  const onSave = () => {
    if (!title.trim()) {
      toast.error("Give it a title first");
      return;
    }
    if (category === "Other" && !customCategory.trim()) {
      toast.error("Name your custom category");
      return;
    }
    const now = Date.now();
    upsert({
      id: entry?.id ?? crypto.randomUUID(),
      title: title.trim(),
      category,
      customCategory: category === "Other" ? customCategory.trim() : undefined,
      description,
      tags,
      favorite: entry?.favorite ?? false,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    });
    toast.success(entry ? "Entry updated" : "Entry saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-serif-display text-2xl">
            {entry ? "Edit entry" : "New entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cold Anger"
                className="font-serif-display text-lg"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {category === "Other" && (
            <div className="space-y-1.5">
              <Label htmlFor="customCategory">Custom category name</Label>
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Weather, Magic System, Cuisine…"
                list="custom-category-suggestions"
              />
              {customCategorySuggestions.length > 0 && (
                <datalist id="custom-category-suggestions">
                  {customCategorySuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Description</Label>
            <RichEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe it. Paste from notes. Sketch a scene…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>{entry ? "Save changes" : "Add to library"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
