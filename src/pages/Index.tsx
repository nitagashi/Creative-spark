import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  BookOpen,
  Download,
  Upload,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, type Filter } from "@/components/AppSidebar";
import { EntryCard } from "@/components/EntryCard";
import { EntryEditor } from "@/components/EntryEditor";
import { EntryView } from "@/components/EntryView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntries, stripHtml, validateEntries } from "@/lib/store";
import type { Entry } from "@/lib/types";

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
import { toast } from "sonner";

const Index = () => {
  const { entries, remove, toggleFavorite, importEntries } = useEntries();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [viewing, setViewing] = useState<Entry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    entries.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    });
    return {
      all: entries.length,
      favorites: entries.filter((e) => e.favorite).length,
      byCategory,
    };
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (filter.kind === "favorites") list = list.filter((e) => e.favorite);
    else if (filter.kind === "category")
      list = list.filter((e) => e.category === filter.value);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const haystack = [
          e.title,
          e.category,
          e.tags.join(" "),
          stripHtml(e.description),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, filter, query]);

  const openNew = () => {
    setEditingEntry(null);
    setEditorOpen(true);
  };
  const openEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Entry[] | null>(null);

  const handleExport = async () => {
    try {
      // Get the entries data (from your original code)
      if (!entries || entries.length === 0) {
        toast.error("No entries to export");
        return;
      }

      // Use Tauri dialog plugin
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");

      // Create stamp for filename like original code
      const stamp = new Date().toISOString().slice(0, 10);

      // Ask user where to save
      const filePath = await save({
        defaultPath: `inkwell-${stamp}.json`,
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
      });

      if (filePath) {
        // Write the entries data to file
        await writeTextFile(filePath, JSON.stringify(entries, null, 2));
        toast.success(
          `Exported ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`,
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export entries");
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const valid = validateEntries(parsed);
      if (!valid) {
        toast.error("That file doesn't look like an Inkwell export");
        return;
      }
      if (valid.length === 0) {
        toast.error("No entries found in that file");
        return;
      }
      setPendingImport(valid);
    } catch {
      toast.error("Couldn't read that file");
    }
  };

  const filterLabel =
    filter.kind === "all"
      ? "All entries"
      : filter.kind === "favorites"
        ? "Favorites"
        : filter.value;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar filter={filter} onChange={setFilter} counts={counts} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/60">
            <div className="flex items-center gap-3 px-4 sm:px-8 py-3">
              <SidebarTrigger className="shrink-0" />
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, tags, content…"
                  className="pl-9 bg-muted/40 border-border/60 focus-visible:bg-background"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More options">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleExport}
                    disabled={entries.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export library
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Import library…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled
                    className="text-xs text-muted-foreground"
                  >
                    JSON format
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = "";
                }}
              />
              <Button onClick={openNew} className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New entry</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-8 fade-in">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {query ? `Results for "${query}"` : "Your library"}
                  </p>
                  <h2 className="font-serif-display text-4xl sm:text-5xl font-semibold">
                    {filterLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {filtered.length}{" "}
                    {filtered.length === 1 ? "entry" : "entries"}
                  </p>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState onNew={openNew} hasQuery={!!query} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onOpen={() => setViewing(entry)}
                      onEdit={() => openEdit(entry)}
                      onDelete={() => setConfirmDeleteId(entry.id)}
                      onToggleFavorite={() => toggleFavorite(entry.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Floating quick-add (mobile-friendly) */}
          <button
            onClick={openNew}
            aria-label="Quick add"
            className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl grid place-items-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <EntryEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        entry={editingEntry}
        defaultCategory={filter.kind === "category" ? filter.value : undefined}
      />

      <EntryView
        entry={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        onToggleFavorite={() => {
          if (viewing) {
            toggleFavorite(viewing.id);
            setViewing({ ...viewing, favorite: !viewing.favorite });
          }
        }}
        onEdit={() => {
          if (viewing) {
            const entryToEdit = viewing;
            setViewing(null);
            openEdit(entryToEdit);
          }
        }}
      />

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The entry will be removed from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  remove(confirmDeleteId);
                  toast.success("Entry deleted");
                  setConfirmDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingImport}
        onOpenChange={(o) => !o && setPendingImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {pendingImport?.length}{" "}
              {pendingImport?.length === 1 ? "entry" : "entries"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Choose how to bring these into your library. Merging keeps your
              current entries and updates any with matching IDs. Replacing wipes
              your current library first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (!pendingImport) return;
                const r = importEntries(pendingImport, "replace");
                toast.success(`Replaced library with ${r.total} entries`);
                setPendingImport(null);
              }}
            >
              Replace
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (!pendingImport) return;
                const r = importEntries(pendingImport, "merge");
                toast.success(`Imported ${r.added} new, updated ${r.updated}`);
                setPendingImport(null);
              }}
            >
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

function EmptyState({
  onNew,
  hasQuery,
}: {
  onNew: () => void;
  hasQuery: boolean;
}) {
  return (
    <div className="ink-card p-12 text-center fade-in">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-serif-display text-2xl font-semibold mb-2">
        {hasQuery ? "Nothing found" : "Your library awaits"}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-6">
        {hasQuery
          ? "Try a different search, or clear the filter to see all your entries."
          : "Capture an emotion, a wound, a name. Anything that helps your stories breathe."}
      </p>
      {!hasQuery && (
        <Button onClick={onNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add your first entry
        </Button>
      )}
    </div>
  );
}

export default Index;
