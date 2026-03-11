import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { join } from "path";

function getDirSize(dir: string): number {
  try {
    const result = execSync(
      `powershell -Command "(Get-ChildItem -Path '${dir}' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`,
      { encoding: "utf-8", timeout: 30000 }
    ).trim();
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

const KNOWN_FOLDERS: Record<string, { desc: string; removable: boolean }> = {
  ".vscode": { desc: "VS Code 설정", removable: false },
  ".git": { desc: "Git 저장소", removable: false },
  "node_modules": { desc: "Node.js 패키지 (재설치 가능)", removable: true },
  ".next": { desc: "Next.js 빌드 캐시", removable: true },
  "__pycache__": { desc: "Python 캐시", removable: true },
  ".cache": { desc: "캐시 폴더", removable: true },
  "dist": { desc: "빌드 결과물", removable: true },
  "build": { desc: "빌드 결과물", removable: true },
  ".turbo": { desc: "Turbo 캐시", removable: true },
  ".angular": { desc: "Angular 캐시", removable: true },
  "coverage": { desc: "테스트 커버리지", removable: true },
  ".parcel-cache": { desc: "Parcel 캐시", removable: true },
};

interface FolderInfo {
  path: string;
  name: string;
  sizeMB: number;
  description: string;
  removable: boolean;
  type: "project" | "cache" | "system" | "unknown";
  lastModified: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scanPath = searchParams.get("path") || "C:/Users/droli";

  const results: FolderInfo[] = [];

  try {
    const entries = readdirSync(scanPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("$") || entry.name === "AppData") continue;

      const fullPath = join(scanPath, entry.name);
      try {
        const stat = statSync(fullPath);
        const known = KNOWN_FOLDERS[entry.name];

        let type: FolderInfo["type"] = "unknown";
        let description = "";
        let removable = false;

        if (known) {
          description = known.desc;
          removable = known.removable;
          type = removable ? "cache" : "project";
        } else {
          try {
            const contents = readdirSync(fullPath);
            if (contents.includes("package.json")) {
              type = "project";
              description = "Node.js 프로젝트";
            } else if (contents.includes("requirements.txt") || contents.includes("setup.py")) {
              type = "project";
              description = "Python 프로젝트";
            } else if (contents.includes(".git")) {
              type = "project";
              description = "Git 프로젝트";
            } else {
              type = "unknown";
              description = "폴더";
            }
          } catch {
            description = "접근 불가";
          }
        }

        results.push({
          path: fullPath,
          name: entry.name,
          sizeMB: 0,
          description,
          removable,
          type,
          lastModified: stat.mtime.toISOString(),
        });
      } catch {
        // skip inaccessible
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ folders: results, scanPath });
}

export async function DELETE(request: Request) {
  const { path } = await request.json();
  if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 });

  try {
    execSync(`rmdir /S /Q "${path}"`, { encoding: "utf-8", timeout: 60000 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
