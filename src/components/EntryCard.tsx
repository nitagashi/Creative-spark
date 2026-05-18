import { Star, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { type Entry, displayCategory } from "@/lib/types";
import { stripHtml } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onOpen: () => void;
}

export function EntryCard({ entry, onEdit, onDelete, onToggleFavorite, onOpen }: Props) {
  const preview = stripHtml(entry.description).slice(0, 180);

  return (
    <article
      onClick={onOpen}
      className="ink-card group p-5 cursor-pointer flex flex-col gap-3 fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary/90">
              {displayCategory(entry)}
            </Badge>
          </div>
          <h3 className="font-serif-display text-2xl font-semibold leading-tight truncate">
            {entry.title}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label={entry.favorite ? "Unfavorite" : "Favorite"}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              entry.favorite ? "fill-gold text-gold" : "text-muted-foreground"
            )}
          />
        </button>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {preview || <span className="italic opacity-60">No description yet…</span>}
      </p>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[11px] text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-full"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
        <span className="text-[11px] text-muted-foreground/70">
          {format(entry.updatedAt, "MMM d, yyyy")}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </article>
  );
}
