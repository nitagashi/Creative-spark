import { useState, KeyboardEvent, useMemo, useRef, FocusEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: Props) {
  const [input, setInput] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && !value.includes(s))
      .slice(0, 6);
  }, [input, suggestions, value]);

  const add = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (wrapperRef.current?.contains(e.relatedTarget as Node)) return;
    add(input);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background/40 px-3 py-2 focus-within:border-primary/50 transition-colors min-h-[44px]">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 bg-accent text-accent-foreground hover:bg-accent/80"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="hover:text-destructive transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={value.length === 0 ? "Add tags…" : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
        />
      </div>
      {filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden fade-in">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
