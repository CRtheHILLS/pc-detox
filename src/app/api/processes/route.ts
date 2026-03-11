import { NextResponse } from "next/server";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 15000 }).trim();
  } catch {
    return "";
  }
}

interface ProcessInfo {
  pid: number;
  name: string;
  memMB: number;
  port: number | null;
  type: "server" | "app" | "security" | "system" | "background";
  description: string;
}

const KNOWN_PROCESSES: Record<string, { type: ProcessInfo["type"]; desc: string }> = {
  "node.exe": { type: "server", desc: "Node.js 서버" },
  "python.exe": { type: "server", desc: "Python 프로세스" },
  "java.exe": { type: "server", desc: "Java 프로세스" },
  "nginx.exe": { type: "server", desc: "Nginx 웹서버" },
  "mongod.exe": { type: "server", desc: "MongoDB" },
  "postgres.exe": { type: "server", desc: "PostgreSQL" },
  "redis-server.exe": { type: "server", desc: "Redis" },
  "HGridEngine.exe": { type: "security", desc: "증권 HTS 엔진" },
  "sCourtScanLauncher.exe": { type: "security", desc: "대법원 전자소송 보안" },
  "nosstarter.npe": { type: "security", desc: "NOS 키보드 보안" },
  "I3GProc.exe": { type: "security", desc: "IPinside 금융보안" },
  "smmgr.exe": { type: "security", desc: "보안 모듈 매니저" },
  "macourtsafer.exe": { type: "security", desc: "법원 보안 프로그램" },
  "Code.exe": { type: "app", desc: "Visual Studio Code" },
  "chrome.exe": { type: "app", desc: "Google Chrome" },
  "msedge.exe": { type: "app", desc: "Microsoft Edge" },
  "firefox.exe": { type: "app", desc: "Firefox" },
  "explorer.exe": { type: "system", desc: "Windows 탐색기" },
  "svchost.exe": { type: "system", desc: "Windows 서비스 호스트" },
};

export async function GET() {
  const portsRaw = run('netstat -ano | findstr LISTENING');
  const portMap = new Map<number, number>();
  for (const line of portsRaw.split("\n")) {
    const match = line.trim().match(/:(\d+)\s+.*LISTENING\s+(\d+)/);
    if (match) {
      const port = parseInt(match[1]);
      const pid = parseInt(match[2]);
      if (port < 49152) portMap.set(pid, port);
    }
  }

  const taskRaw = run('tasklist /FO CSV /NH');
  const seen = new Set<string>();
  const processes: ProcessInfo[] = [];

  for (const line of taskRaw.split("\n")) {
    const parts = line.match(/"([^"]+)"/g);
    if (!parts || parts.length < 5) continue;
    const name = parts[0].replace(/"/g, "");
    const pid = parseInt(parts[1].replace(/"/g, ""));
    const memStr = parts[4].replace(/"/g, "").replace(/[^\d]/g, "");
    const memMB = Math.round(parseInt(memStr) / 1024);

    if (seen.has(name) && !portMap.has(pid)) continue;
    seen.add(name);

    const known = KNOWN_PROCESSES[name];
    const port = portMap.get(pid) || null;
    let type: ProcessInfo["type"] = known?.type || "background";
    if (port && type === "background") type = "server";

    if (type === "system" && memMB < 10) continue;

    processes.push({
      pid,
      name,
      memMB,
      port,
      type,
      description: known?.desc || name.replace(".exe", ""),
    });
  }

  processes.sort((a, b) => {
    const order = { server: 0, security: 1, app: 2, background: 3, system: 4 };
    return (order[a.type] - order[b.type]) || (b.memMB - a.memMB);
  });

  return NextResponse.json({ processes });
}

export async function DELETE(request: Request) {
  const { pid } = await request.json();
  if (!pid) return NextResponse.json({ error: "PID required" }, { status: 400 });
  try {
    execSync(`taskkill /PID ${pid} /F`, { encoding: "utf-8", timeout: 5000 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
