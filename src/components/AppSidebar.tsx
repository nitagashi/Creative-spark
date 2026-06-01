import { BookOpen, Sparkles, Heart, LayoutGrid, Tag, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BUILTIN_CATEGORIES, type Category } from "@/lib/types";
import { useCustomCategories } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Filter =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "category"; value: Category };

interface Props {
  filter: Filter;
  onChange: (f: Filter) => void;
  counts: {
    all: number;
    favorites: number;
    byCategory: Record<string, number>;
  };
}

export function AppSidebar({ filter, onChange, counts }: Props) {
  const { customCategories, removeCustomCategory } = useCustomCategories();
  const isActive = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);

  const Item = ({
    f,
    icon: Icon,
    label,
    count,
  }: {
    f: Filter;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
  }) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => onChange(f)}
        className={cn(
          "group/item h-9",
          isActive(f) &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            isActive(f) ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          {count}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-display text-lg font-semibold leading-none">
              Creative Spark
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              writing library manager
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Item
                f={{ kind: "all" }}
                icon={LayoutGrid}
                label="All entries"
                count={counts.all}
              />
              <Item
                f={{ kind: "favorites" }}
                icon={Heart}
                label="Favorites"
                count={counts.favorites}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {BUILTIN_CATEGORIES.map((c) => (
                <Item
                  key={c}
                  f={{ kind: "category", value: c }}
                  icon={Sparkles}
                  label={c}
                  count={counts.byCategory[c] ?? 0}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {customCategories.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Custom categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customCategories.map((c) => {
                  const active = isActive({ kind: "category", value: c });
                  const count = counts.byCategory[c] ?? 0;
                  return (
                    <SidebarMenuItem key={c}>
                      <SidebarMenuButton
                        onClick={() => onChange({ kind: "category", value: c })}
                        className={cn(
                          "group/item h-9",
                          active &&
                            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                        )}
                      >
                        <Tag className="h-4 w-4" />
                        <span className="flex-1 truncate">{c}</span>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            active
                              ? "text-primary"
                              : "text-muted-foreground/60",
                          )}
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (count > 0) {
                              toast.error(
                                `"${c}" is still used by ${count} ${
                                  count === 1 ? "entry" : "entries"
                                }`,
                              );
                              return;
                            }
                            removeCustomCategory(c);
                            if (active) onChange({ kind: "all" });
                          }}
                          className="opacity-0 group-hover/item:opacity-100 rounded p-0.5 hover:bg-destructive/10 hover:text-destructive transition"
                          aria-label={`Delete category ${c}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
