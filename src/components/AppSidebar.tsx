import { useEffect, useState } from "react";
import {
  BookOpen,
  Sparkles,
  Heart,
  LayoutGrid,
  Tag,
  X,
  Pencil,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { BUILTIN_CATEGORIES, type Category } from "@/lib/types";
import { useCustomCategories } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RenameCategoryDialog } from "./RenameCategoryDialog";
import { SettingsDialog } from "./SettingsDialog";
import { getVersion } from "@tauri-apps/api/app";
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
  const { customCategories, removeCustomCategory, renameCustomCategory } =
    useCustomCategories();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [renaming, setRenaming] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [version, setVersion] = useState<string>("");
  useEffect(() => {
    // Check on app start
    const fetchVersion = async () => {
      try {
        const v = await getVersion();
        setVersion(v);
      } catch (error) {
        console.error("Failed to get app version:", error);
        setVersion("");
      }
    };
    fetchVersion();
  }, []);
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
        tooltip={label}
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
            "text-xs tabular-nums group-data-[collapsible=icon]:hidden",
            isActive(f) ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          {count}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 py-5 border-b border-sidebar-border group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/15 grid place-items-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h1 className="font-serif-display text-lg font-semibold leading-none">
                Creative Spark
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
                      <SidebarMenuItem key={c} className="group/cat relative">
                        <SidebarMenuButton
                          onClick={() =>
                            onChange({ kind: "category", value: c })
                          }
                          tooltip={c}
                          className={cn(
                            "h-9 ",
                            active &&
                              "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                          )}
                        >
                          <Tag className="h-4 w-4 " />
                          <span className="flex-1 truncate ">{c}</span>
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition group-data-[collapsible=icon]:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenaming(c);
                              }}
                              className="rounded p-1 hover:bg-accent hover:text-foreground"
                              aria-label={`Rename category ${c}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
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
                              className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete category ${c}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <span
                            className={cn(
                              "text-xs tabular-nums group-data-[collapsible=icon]:hidden group-hover/cat:opacity-0",
                              active
                                ? "text-primary"
                                : "text-muted-foreground/60",
                            )}
                          >
                            {count}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSettingsOpen(true)}
                tooltip="Settings"
                className="h-9"
              >
                <Settings className="h-4 w-4" />
                <span className="flex-1">Settings</span>
                {!collapsed && (
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    v{version}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <RenameCategoryDialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        currentName={renaming}
        onRename={(oldName, newName) => {
          const res = renameCustomCategory(oldName, newName);
          if (res.ok) {
            toast.success(`Renamed to "${newName.trim()}"`);
            if (filter.kind === "category" && filter.value === oldName) {
              onChange({ kind: "category", value: newName.trim() });
            }
          }
          return res;
        }}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
