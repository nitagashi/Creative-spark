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
import { APP_BUILD_DATE } from "@/lib/version";
import { toast } from "sonner";
import { useAppUpdater } from "@/hooks/useAppUpdater";
import { getVersion } from "@tauri-apps/api/app";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  // Get the UpdateDialog component from the hook
  const { checkForUpdates, UpdateDialog, checking, setShowUpdateDialog } =
    useAppUpdater();
  // checkForUpdates();
  const [version, setVersion] = useState<string>("");
  const [buildDate, setBuildDate] = useState(APP_BUILD_DATE);
  useEffect(() => {
    // Check on app start
    checkForUpdates(true); // silent mode, won't prompt if no update
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
    // Check every 6 hours
    const interval = setInterval(
      () => checkForUpdates(true),
      6 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Settings</DialogTitle>
            <DialogDescription>
              About Inkwell and app updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md border bg-muted/30 p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Version
                </span>
                <span className="text-sm font-semibold text-primary">
                  {version}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Build
                </span>
                <span className="text-sm">
                  {new Date(APP_BUILD_DATE).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Check the release feed for a newer version.
              </div>
              <Button onClick={() => checkForUpdates()} disabled={checking}>
                {checking ? "Checking…" : "Check for updates"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <Dialog
        open={showUpdateDialog}
        onOpenChange={(o) => {
          if (!o && !isInstalling) {
            setShowUpdateDialog(false);
            setPendingUpdate(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Update Available!</DialogTitle>
            <DialogDescription>
              A new version of the application is ready to install.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Version:
                </span>
                <span className="text-lg font-semibold text-primary">
                  {pendingUpdate?.version}
                </span>
              </div>

              {pendingUpdate?.date && (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Released:
                  </span>
                  <span className="text-sm">
                    {new Date(pendingUpdate.date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {pendingUpdate?.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  What's new:
                </h4>
                <div className="max-h-[200px] overflow-y-auto rounded-md bg-muted/30 p-3 text-sm">
                  <pre className="whitespace-pre-wrap font-sans">
                    {pendingUpdate.notes}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleLater}
              disabled={isInstalling}
            >
              Later
            </Button>
            <Button onClick={handleInstall} disabled={isInstalling}>
              {isInstalling ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Installing...
                </>
              ) : (
                "Install & Restart"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
