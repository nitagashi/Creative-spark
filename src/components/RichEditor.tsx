import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Undo2,
  Redo2,
  ImagePlus,
  Replace,
  Trash2,
  Lock,
  Unlock,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Image extension with persisted numeric width/height (pixels)
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute("width") || el.style.width;
          if (!w) return null;
          const n = parseInt(w, 10);
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (el) => {
          const h = el.getAttribute("height") || el.style.height;
          if (!h) return null;
          const n = parseInt(h, 10);
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attrs) => (attrs.height ? { height: attrs.height } : {}),
      },
    };
  },
});

export function RichEditor({ value, onChange, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: placeholder ?? "Begin writing…" }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg my-3 max-w-full h-auto border border-border/40",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap prose-ink max-w-none px-4 py-3",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              insertImageFromFile(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(insertImageFromFile);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const insertImageFromFile = async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That's not an image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 2 MB)");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      editor.chain().focus().setImage({ src: dataUrl }).run();
    } catch {
      toast.error("Could not read image");
    }
  };

  const replaceSelectedImage = async (file: File) => {
    if (!editor) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That's not an image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large (max 2 MB)");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      // Update the currently selected image's src in place
      editor.chain().focus().updateAttributes("image", { src: dataUrl }).run();
    } catch {
      toast.error("Could not read image");
    }
  };

  const setImageSize = (size: { width?: number | null; height?: number | null }) => {
    editor?.chain().focus().updateAttributes("image", size).run();
  };

  const removeImage = () => {
    editor?.chain().focus().deleteSelection().run();
  };

  // Sync external value when switching entries
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const ToolbarBtn = ({
    active,
    onClick,
    children,
    label,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
  }) => (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );

  const imageAttrs = editor.getAttributes("image") as {
    src?: string;
    width?: number | null;
    height?: number | null;
  };

  return (
    <div className="rounded-xl border border-border bg-background/40 focus-within:border-primary/50 transition-colors">
      <div className="flex items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
        <ToolbarBtn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarBtn>
        <div className="ml-auto flex">
          <ToolbarBtn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarBtn>
        </div>
      </div>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => editor.isActive("image")}
        options={{ placement: "top" }}
      >
        <div className="flex items-center gap-1 rounded-lg border border-border bg-popover/95 backdrop-blur shadow-lg p-1 fade-in">
          <ImageSizeControls
            key={imageAttrs.src ?? ""}
            src={imageAttrs.src}
            width={imageAttrs.width ?? null}
            height={imageAttrs.height ?? null}
            onChange={setImageSize}
          />
          <div className="w-px h-5 bg-border mx-1" />
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium hover:bg-accent transition-colors"
            title="Replace image"
          >
            <Replace className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={removeImage}
            className="flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove image"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImageFromFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) replaceSelectedImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface ImageSizeControlsProps {
  src?: string;
  width: number | null;
  height: number | null;
  onChange: (size: { width?: number | null; height?: number | null }) => void;
}

function ImageSizeControls({ src, width, height, onChange }: ImageSizeControlsProps) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [locked, setLocked] = useState(true);
  const [precise, setPrecise] = useState(false); // false = S/M/L, true = W×H inputs
  const [wInput, setWInput] = useState<string>(width != null ? String(width) : "");
  const [hInput, setHInput] = useState<string>(height != null ? String(height) : "");

  // Load natural size from the src
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Sync inputs when selection / attrs change externally
  useEffect(() => {
    setWInput(width != null ? String(width) : natural ? String(natural.w) : "");
    setHInput(height != null ? String(height) : natural ? String(natural.h) : "");
  }, [width, height, natural]);

  const ratio =
    natural && natural.h > 0
      ? natural.w / natural.h
      : width && height
      ? width / height
      : null;

  const applyWidth = (px: number) => {
    if (ratio) {
      onChange({ width: px, height: Math.round(px / ratio) });
    } else {
      onChange({ width: px, height: null });
    }
  };

  const PRESETS: { key: "S" | "M" | "L"; px: number }[] = [
    { key: "S", px: 200 },
    { key: "M", px: 400 },
    { key: "L", px: 700 },
  ];

  const activePreset =
    width != null ? PRESETS.find((p) => Math.abs(p.px - width) <= 2)?.key : null;

  const commitWidth = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const clamped = Math.min(2000, Math.max(20, n));
    if (locked && ratio) {
      onChange({ width: clamped, height: Math.round(clamped / ratio) });
    } else {
      onChange({ width: clamped });
    }
  };

  const commitHeight = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const clamped = Math.min(2000, Math.max(20, n));
    if (locked && ratio) {
      onChange({ width: Math.round(clamped * ratio), height: clamped });
    } else {
      onChange({ height: clamped });
    }
  };

  const NumberField = ({
    value,
    onValueChange,
    onCommit,
    label,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    onCommit: (v: string) => void;
    label: string;
  }) => (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        min={20}
        max={2000}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit((e.target as HTMLInputElement).value);
          }
        }}
        className="w-14 h-7 px-1.5 text-xs rounded-md border border-border bg-background tabular-nums focus:outline-none focus:border-primary/50"
      />
    </div>
  );

  return (
    <div className="flex items-center gap-1 px-1">
      {!precise ? (
        <>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyWidth(p.px)}
              className={cn(
                "px-2 h-7 rounded-md text-xs font-medium transition-colors hover:bg-accent",
                activePreset === p.key && "bg-accent text-accent-foreground"
              )}
              title={`${p.px}px wide`}
            >
              {p.key}
            </button>
          ))}
        </>
      ) : (
        <>
          <NumberField label="W" value={wInput} onValueChange={setWInput} onCommit={commitWidth} />
          <button
            type="button"
            onClick={() => setLocked((l) => !l)}
            className={cn(
              "h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition-colors",
              locked ? "text-primary" : "text-muted-foreground"
            )}
            title={locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
          >
            {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
          <NumberField label="H" value={hInput} onValueChange={setHInput} onCommit={commitHeight} />
        </>
      )}
      <button
        type="button"
        onClick={() => setPrecise((p) => !p)}
        className={cn(
          "h-7 w-7 grid place-items-center rounded-md hover:bg-accent transition-colors ml-0.5",
          precise ? "text-primary bg-accent" : "text-muted-foreground"
        )}
        title={precise ? "Use presets (S/M/L)" : "Set exact width × height"}
      >
        <Ruler className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
