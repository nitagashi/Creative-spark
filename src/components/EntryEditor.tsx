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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, X, Plus, Check } from "lucide-react";
import { RichEditor } from "./RichEditor";
import { TagInput } from "./TagInput";
import {
  BUILTIN_CATEGORIES,
  isBuiltinCategory,
  type Category,
  type Entry,
} from "@/lib/types";
import { useEntries, useCustomCategories } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [restoreOpen, setRestoreOpen] = useState(false);
  const pendingDraftRef = useRef<null | {
    t: string;
    c: Category;
    cc: string;
    d: string;
    tg: string[];
    savedAt: number;
  }>(null);

  const { customCategories, addCustomCategory, removeCustomCategory } =
    useCustomCategories();
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();

  const initialSnapshotRef = useRef<string>("");
  const draftKey = useMemo(
    () => `entry-editor-draft:${entry?.id ?? "new"}`,
    [entry?.id],
  );

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

      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          const draftSig = JSON.stringify({
            t: draft.t,
            c: draft.c,
            cc: draft.cc,
            d: draft.d,
            tg: draft.tg,
          });
          if (draftSig !== initialSnapshotRef.current) {
            pendingDraftRef.current = draft;
            setRestoreOpen(true);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [open, entry, defaultCategory, draftKey]);

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

  // Auto-persist draft while editing
  useEffect(() => {
    if (!open || restoreOpen) return;
    if (!isDirty) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      return;
    }
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            t: title,
            c: category,
            cc: customCategory,
            d: description,
            tg: tags,
            savedAt: Date.now(),
          }),
        );
      } catch {
        // ignore quota errors
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [
    open,
    restoreOpen,
    isDirty,
    draftKey,
    title,
    category,
    customCategory,
    description,
    tags,
  ]);

  const onSave = (close = false) => {
    if (!title.trim()) {
      toast.error("Give it a title first");
      return false;
    }
    const now = Date.now();
    upsert({
      id: entry?.id ?? crypto.randomUUID(),
      title: title.trim(),
      category,
      customCategory: undefined,
      description,
      tags,
      favorite: entry?.favorite ?? false,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    });
    initialSnapshotRef.current = JSON.stringify({
      t: title.trim(),
      c: category,
      cc: "",
      d: description,
      tg: tags,
    });
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
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

  // Block browser navigation/tab close when dirty
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="font-serif-display text-2xl">
                {entry ? "Edit entry" : "New entry"}
              </DialogTitle>
              {isDirty && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 border"
                  style={{
                    color: "hsl(var(--gold))",
                    backgroundColor: "hsl(var(--gold) / 0.1)",
                    borderColor: "hsl(var(--gold) / 0.2)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>
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
                <CategoryPicker
                  value={category}
                  onChange={setCategory}
                  builtin={[...BUILTIN_CATEGORIES]}
                  custom={customCategories}
                  onAdd={(name) => {
                    addCustomCategory(name);
                    setCategory(name);
                  }}
                  onDelete={(name) => {
                    const inUse = entries.some((e) => e.category === name);
                    if (inUse) {
                      toast.error(`"${name}" is still used by some entries`);
                      return;
                    }
                    removeCustomCategory(name);
                    if (category === name) setCategory("Emotion");
                  }}
                />
              </div>
            </div>

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

      <AlertDialog
        open={restoreOpen}
        onOpenChange={(o) => {
          if (!o) {
            setRestoreOpen(false);
            pendingDraftRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore unsaved draft?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDraftRef.current?.savedAt
                ? `You left unsaved changes from ${new Date(
                    pendingDraftRef.current.savedAt,
                  ).toLocaleString()}. Restore them?`
                : "You have an unsaved draft. Restore it?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey);
                } catch {
                  // ignore
                }
                pendingDraftRef.current = null;
                setRestoreOpen(false);
              }}
            >
              Discard draft
            </Button>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const d = pendingDraftRef.current;
                if (d) {
                  setTitle(d.t);
                  setCategory(d.c);
                  setCustomCategory(d.cc);
                  setDescription(d.d);
                  setTags(d.tg);
                }
                pendingDraftRef.current = null;
                setRestoreOpen(false);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface CategoryPickerProps {
  value: string;
  onChange: (v: string) => void;
  builtin: string[];
  custom: string[];
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
}

function CategoryPicker({
  value,
  onChange,
  builtin,
  custom,
  onAdd,
  onDelete,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const all = [...builtin, ...custom];
  const trimmed = draft.trim();
  const exists = all.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !exists;

  const submit = () => {
    if (!canAdd) return;
    onAdd(trimmed);
    setDraft("");
    setOpen(false);
  };

  const Row = ({ name, deletable }: { name: string; deletable: boolean }) => {
    const selected = value === name;
    return (
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
          selected && "bg-accent/60",
        )}
        onClick={() => {
          onChange(name);
          setOpen(false);
        }}
      >
        <Check
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            selected ? "opacity-100 text-primary" : "opacity-0",
          )}
        />
        <span className="flex-1 truncate">{name}</span>
        {deletable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(name);
            }}
            className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/10 hover:text-destructive transition"
            aria-label={`Delete category ${name}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select category"}</span>
          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-1 w-[var(--radix-popover-trigger-width)] min-w-[240px]"
      >
        <div className="max-h-64 overflow-y-auto">
          <div className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Built-in
          </div>
          {builtin.map((c) => (
            <Row key={c} name={c} deletable={false} />
          ))}
          {custom.length > 0 && (
            <>
              <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Custom
              </div>
              {custom.map((c) => (
                <Row key={c} name={c} deletable />
              ))}
            </>
          )}
          {!isBuiltinCategory(value) && value && !custom.includes(value) && (
            <>
              <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Current
              </div>
              <Row name={value} deletable={false} />
            </>
          )}
        </div>
        <div className="border-t mt-1 pt-1 flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="New category…"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={!canAdd}
            onClick={submit}
            aria-label="Add category"
            className="h-8 w-8 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
