import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [checking, setChecking] = useState(false);

  const checkForUpdates = async (silent: boolean = false) => {
    setChecking(true);
    try {
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateVersion(update.version);
        // setUpdateNotes(update.notes || "");

        if (!silent) {
          // Prompt user to install
          const confirmed = window.confirm(
            `Update available! 🎉\n\nVersion: ${update.version}\n\n${"No release notes provided."}\n\nInstall now? The app will restart automatically.`,
          );

          if (confirmed) {
            await update.downloadAndInstall();
            await relaunch();
          }
        }

        return true;
      }

      if (!silent) {
        console.log("App is up to date");
      }

      return false;
    } catch (error) {
      console.error("Update check failed:", error);
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Check on app start
    checkForUpdates(true); // silent mode, won't prompt if no update

    // Check every 6 hours
    const interval = setInterval(
      () => checkForUpdates(true),
      6 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return {
    updateAvailable,
    updateVersion,
    updateNotes,
    checking,
    checkForUpdates,
  };
}
