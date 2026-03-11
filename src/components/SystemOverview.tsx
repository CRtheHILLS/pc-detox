"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Clock, Monitor } from "lucide-react";

interface SystemData {
  cpu: { percent: number; name: string; cores: string };
  memory: { percent: number; totalMB: number; usedMB: number; freeMB: number };
  disks: { id: string; name: string; totalGB: number; freeGB: number; usedGB: number; percent: number }[];
  uptime: string;
  os: string;
  hostname: string;
}

function Ring({ percent, size = 100, color = "#0071e3", label }: { percent: number; size?: number; label: string; color?: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const dangerColor = percent > 85 ? "#ff3b30" : percent > 65 ? "#ff9f0a" : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="stat-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={dangerColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          fill="var(--text-primary)" fontSize="20" fontWeight="600">
          {percent}%
        </text>
      </svg>
      <span className="text-xs text-[var(--text-secondary)] font-medium">{label}</span>
    </div>
  );
}

export default function SystemOverview() {
  const [data, setData] = useState<SystemData | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/system").then(r => r.json()).then(setData).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  if (!data) return (
    <div className="glass-card p-8 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
      <div className="flex gap-8">
        <div className="h-24 w-24 bg-gray-200 rounded-full" />
        <div className="h-24 w-24 bg-gray-200 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="glass-card p-6 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Monitor size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{data.hostname}</h2>
            <p className="text-xs text-[var(--text-secondary)]">{data.os}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Clock size={12} />
          <span>업타임 {data.uptime}</span>
        </div>
      </div>

      <div className="flex items-center gap-8 mb-6">
        <Ring percent={data.cpu.percent} label="CPU" />
        <Ring percent={data.memory.percent} label="메모리" color="#34c759" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Cpu size={13} className="text-[var(--text-secondary)]" />
        <span className="text-xs text-[var(--text-secondary)]">{data.cpu.name} ({data.cpu.cores}코어)</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <MemoryStick size={13} className="text-[var(--text-secondary)]" />
        <span className="text-xs text-[var(--text-secondary)]">
          {(data.memory.usedMB / 1024).toFixed(1)}GB / {(data.memory.totalMB / 1024).toFixed(1)}GB
          ({(data.memory.freeMB / 1024).toFixed(1)}GB 여유)
        </span>
      </div>

      <div className="space-y-3">
        {data.disks.map(d => (
          <div key={d.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <HardDrive size={13} className="text-[var(--text-secondary)]" />
                <span className="text-xs font-medium">{d.id} {d.name}</span>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{d.freeGB}GB 여유 / {d.totalGB}GB</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${d.percent}%`,
                  background: d.percent > 85 ? "#ff3b30" : d.percent > 65 ? "#ff9f0a" : "#0071e3",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
