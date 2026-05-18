import { BookOpen, Sparkles, Heart, LayoutGrid } from "lucide-react";
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
import { CATEGORIES, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          isActive(f) && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{label}</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            isActive(f) ? "text-primary" : "text-muted-foreground/60"
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
              Inkwell
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              writing library
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Item f={{ kind: "all" }} icon={LayoutGrid} label="All entries" count={counts.all} />
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
              {CATEGORIES.map((c) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
