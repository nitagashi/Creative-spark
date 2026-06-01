export const APP_BUILD_DATE = "2026-06-01";

export interface UpdateInfo {
  version: string;
  date?: string;
  notes?: string;
}

// Stub update checker — wire this to your real release feed when available.
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  await new Promise((r) => setTimeout(r, 700));
  return null;
}
