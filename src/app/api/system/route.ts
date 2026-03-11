import { NextResponse } from "next/server";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 10000 }).trim();
  } catch {
    return "";
  }
}

function parseWmic(output: string): Record<string, string>[] {
  const lines = output.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(/\s{2,}/);
  return lines.slice(1).map(line => {
    const vals = line.split(/\s{2,}/);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

export async function GET() {
  const cpuRaw = run('wmic cpu get LoadPercentage /value');
  const cpuMatch = cpuRaw.match(/LoadPercentage=(\d+)/);
  const cpuPercent = cpuMatch ? parseInt(cpuMatch[1]) : 0;

  const cpuName = run('wmic cpu get Name /value').replace('Name=', '').trim();
  const cpuCores = run('wmic cpu get NumberOfCores /value').replace('NumberOfCores=', '').trim();

  const memRaw = run('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value');
  const totalMatch = memRaw.match(/TotalVisibleMemorySize=(\d+)/);
  const freeMatch = memRaw.match(/FreePhysicalMemory=(\d+)/);
  const totalMem = totalMatch ? parseInt(totalMatch[1]) / 1024 : 0;
  const freeMem = freeMatch ? parseInt(freeMatch[1]) / 1024 : 0;
  const usedMem = totalMem - freeMem;
  const memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0;

  const diskRaw = run('wmic logicaldisk get DeviceID,FreeSpace,Size,VolumeName,DriveType /value');
  const diskBlocks = diskRaw.split(/\n\n+/).filter(b => b.includes("DeviceID="));
  const disks = diskBlocks.map(block => {
    const get = (key: string) => {
      const m = block.match(new RegExp(`${key}=(.+)`));
      return m ? m[1].trim() : "";
    };
    const size = parseInt(get("Size")) || 0;
    const free = parseInt(get("FreeSpace")) || 0;
    return {
      id: get("DeviceID"),
      name: get("VolumeName") || get("DeviceID"),
      type: parseInt(get("DriveType")),
      totalGB: +(size / 1073741824).toFixed(1),
      freeGB: +(free / 1073741824).toFixed(1),
      usedGB: +((size - free) / 1073741824).toFixed(1),
      percent: size > 0 ? Math.round(((size - free) / size) * 100) : 0,
    };
  }).filter(d => d.type === 3 && d.totalGB > 0);

  const uptimeRaw = run('wmic os get LastBootUpTime /value');
  const uptimeMatch = uptimeRaw.match(/LastBootUpTime=(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  let uptime = "";
  if (uptimeMatch) {
    const boot = new Date(`${uptimeMatch[1]}-${uptimeMatch[2]}-${uptimeMatch[3]}T${uptimeMatch[4]}:${uptimeMatch[5]}:${uptimeMatch[6]}`);
    const diff = Date.now() - boot.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    uptime = days > 0 ? `${days}일 ${hours}시간` : `${hours}시간 ${mins}분`;
  }

  const osName = run('wmic os get Caption /value').replace('Caption=', '').trim();
  const hostname = run('hostname');

  return NextResponse.json({
    cpu: { percent: cpuPercent, name: cpuName, cores: cpuCores },
    memory: { percent: memPercent, totalMB: Math.round(totalMem), usedMB: Math.round(usedMem), freeMB: Math.round(freeMem) },
    disks,
    uptime,
    os: osName,
    hostname,
  });
}
