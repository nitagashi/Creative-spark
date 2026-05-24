import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Entry, displayCategory } from "@/lib/types";

interface Props {
  entry: Entry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: () => void;
  onEdit?: () => void;
}

export function EntryView({
  entry,
  open,
  onOpenChange,
  onToggleFavorite,
  onEdit,
}: Props) {
  useEffect(() => {
    if (!open || !onEdit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      onEdit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onEdit]);

  if (!entry) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider border-primary/30 text-primary/90 mb-2"
              >
                {displayCategory(entry)}
              </Badge>
              <DialogTitle className="font-serif-display text-3xl font-semibold leading-tight">
                {entry.title}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="gap-1.5 h-9"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              <button
                onClick={onToggleFavorite}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Favorite"
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    entry.favorite
                      ? "fill-gold text-gold"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div
          className="prose-ink mt-4"
          dangerouslySetInnerHTML={{ __html: entry.description }}
        />

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-6">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground/60 mt-6 pt-4 border-t border-border/40">
          Added {format(entry.createdAt, "MMMM d, yyyy")} · Last edited{" "}
          {format(entry.updatedAt, "MMM d, yyyy")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
