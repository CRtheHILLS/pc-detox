import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync } from "fs";

interface CloudDrive {
  name: string;
  path: string;
  exists: boolean;
  type: "google" | "onedrive" | "dropbox" | "icloud" | "unknown";
  sizeMB: number;
}

export async function GET() {
  const user = process.env.USERPROFILE || "C:/Users/droli";

  const cloudPaths: { name: string; path: string; type: CloudDrive["type"] }[] = [
    { name: "Google Drive", path: `${user}/Google Drive`, type: "google" },
    { name: "Google Drive (G:)", path: "G:/", type: "google" },
    { name: "OneDrive", path: `${user}/OneDrive`, type: "onedrive" },
    { name: "OneDrive - Personal", path: `${user}/OneDrive - Personal`, type: "onedrive" },
    { name: "Dropbox", path: `${user}/Dropbox`, type: "dropbox" },
    { name: "iCloud Drive", path: `${user}/iCloudDrive`, type: "icloud" },
  ];

  // Also check for Google Drive Stream
  const gdriveStream = execSync(
    'reg query "HKCU\\Software\\Google\\DriveFS" /v MountPoint 2>nul || echo NOTFOUND',
    { encoding: "utf-8" }
  );
  const gdriveMatch = gdriveStream.match(/MountPoint\s+REG_SZ\s+(.+)/);
  if (gdriveMatch) {
    cloudPaths.push({ name: "Google Drive Stream", path: gdriveMatch[1].trim(), type: "google" });
  }

  const drives: CloudDrive[] = [];
  for (const cp of cloudPaths) {
    const exists = existsSync(cp.path);
    if (exists) {
      drives.push({ name: cp.name, path: cp.path, exists, type: cp.type, sizeMB: 0 });
    }
  }

  // Check running cloud sync processes
  const syncProcesses: { name: string; running: boolean }[] = [];
  const checkProcs = ["GoogleDriveFS", "OneDrive", "Dropbox", "iCloudServices"];
  for (const proc of checkProcs) {
    const result = execSync(
      `tasklist /FI "IMAGENAME eq ${proc}.exe" /FO CSV /NH 2>nul || echo ""`,
      { encoding: "utf-8" }
    );
    syncProcesses.push({ name: proc, running: result.includes(proc) });
  }

  return NextResponse.json({ drives, syncProcesses });
}
