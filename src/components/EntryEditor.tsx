import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export function EntryEditor({
  open,
  onOpenChange,
  entry,
  defaultCategory,
}: Props) {
  const { entries, upsert } = useEntries();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Emotion");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();
  const customCategorySuggestions = Array.from(
    new Set(
      entries
        .filter((e) => e.category === "Other" && e.customCategory)
        .map((e) => e.customCategory!.trim())
        .filter(Boolean),
    ),
  ).sort();

  const initialSnapshotRef = useRef<string>("");

  useEffect(() => {
    if (open) {
      const t = entry?.title ?? "";
      const c = entry?.category ?? defaultCategory ?? "Emotion";
      const cc = entry?.customCategory ?? "";
      const d = entry?.description ?? "";
      const tg = entry?.tags ?? [];
      setTitle(t);
      setCategory(c);
      setCustomCategory(cc);
      setDescription(d);
      setTags(tg);
      initialSnapshotRef.current = JSON.stringify({ t, c, cc, d, tg });
    }
  }, [open, entry, defaultCategory]);

  const isDirty = useMemo(() => {
    if (!open) return false;
    return (
      JSON.stringify({
        t: title,
        c: category,
        cc: customCategory,
        d: description,
        tg: tags,
      }) !== initialSnapshotRef.current
    );
  }, [open, title, category, customCategory, description, tags]);

  const onSave = (close = false) => {
    if (!title.trim()) {
      toast.error("Give it a title first");
      return false;
    }
    if (category === "Other" && !customCategory.trim()) {
      toast.error("Name your custom category");
      return false;
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
    initialSnapshotRef.current = JSON.stringify({
      t: title.trim(),
      c: category,
      cc: category === "Other" ? customCategory.trim() : "",
      d: description,
      tg: tags,
    });
    toast.success(entry ? "Entry updated" : "Entry saved");
    if (close) onOpenChange(false);
    return true;
  };

  const saveRef = useRef<(close?: boolean) => boolean>(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const attemptClose = () => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) attemptClose();
          else onOpenChange(true);
        }}
      >
        <DialogContent
          className="max-w-7xl w-[98vw] max-h-[96vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setConfirmOpen(true);
            }
          }}
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
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
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
              <Button variant="ghost" onClick={attemptClose}>
                Cancel
              </Button>
              <Button onClick={() => onSave(false)}>
                {entry ? "Save changes" : "Add to library"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Save them before closing, or discard to
              lose them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
                onOpenChange(false);
              }}
            >
              Discard
            </Button>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (saveRef.current(true)) {
                  setConfirmOpen(false);
                }
              }}
            >
              Save & close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
