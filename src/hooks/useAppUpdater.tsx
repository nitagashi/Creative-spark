import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UpdateInfo {
  version: string;
  notes?: string;
  date?: string;
}

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [checking, setChecking] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<UpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const checkForUpdates = async (silent: boolean = false) => {
    setChecking(true);
    try {
      console.log("Checking for updates...");
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateVersion(update.version);
        // setUpdateNotes(update.notes || "");

        const updateInfo = {
          version: update.version,
          // notes: update.notes || "",
          date: update.date,
        };

        // Always show dialog when update is found, regardless of silent mode
        // (except maybe you want to keep silent for auto-checks? Let's show it!)
        setPendingUpdate(updateInfo);
        setShowUpdateDialog(true);

        return true;
      }

      if (!silent) {
        console.log("App is up to date");
      }

      return false;
    } catch (error) {
      console.error("Update check failed:", error);
      if (!silent) {
        // You might want to show an error toast here
      }
      return false;
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!pendingUpdate) return;

    setIsInstalling(true);
    try {
      // Get the update object again
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        await relaunch();
      } else {
        console.error("Update not found when trying to install");
        setIsInstalling(false);
      }
    } catch (error) {
      console.error("Failed to install update:", error);
      setIsInstalling(false);
    }
  };

  const handleInstall = async () => {
    await installUpdate();
  };

  const handleLater = () => {
    setShowUpdateDialog(false);
    setPendingUpdate(null);
  };

  useEffect(() => {
    // Check on app start - this will auto-show dialog if update found
    checkForUpdates(false); // false = non-silent, will show dialog

    // Check every 6 hours - this will also auto-show dialog if update found
    const interval = setInterval(
      () => checkForUpdates(false), // Changed to false to auto-show dialog
      6 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  // Update Dialog Component
  const UpdateDialog = () => (
    <Dialog
      open={showUpdateDialog}
      onOpenChange={(open) => {
        if (!open && !isInstalling) {
          setShowUpdateDialog(false);
          setPendingUpdate(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" hideCloseButton={isInstalling}>
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Update Available!</DialogTitle>
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
          <button
            onClick={handleLater}
            disabled={isInstalling}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
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
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    updateAvailable,
    updateVersion,
    updateNotes,
    checking,
    checkForUpdates,
    UpdateDialog,
    showUpdateDialog,
    setShowUpdateDialog,
  };
}
