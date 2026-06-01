import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string | null;
  onRename: (
    oldName: string,
    newName: string,
  ) => { ok: boolean; reason?: string };
}

export function RenameCategoryDialog({
  open,
  onOpenChange,
  currentName,
  onRename,
}: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && currentName) {
      setValue(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const submit = () => {
    if (!currentName) return;
    const res = onRename(currentName, value);
    if (!res.ok) {
      setError(res.reason ?? "Couldn't rename");
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename category</DialogTitle>
          <DialogDescription>
            All entries using this category will be updated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="rename-cat">New name</Label>
          <Input
            id="rename-cat"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
