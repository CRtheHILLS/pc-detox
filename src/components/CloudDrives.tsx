"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

interface CloudDrive {
  name: string;
  path: string;
  exists: boolean;
  type: "google" | "onedrive" | "dropbox" | "icloud" | "unknown";
  sizeMB: number;
}

interface SyncProcess {
  name: string;
  running: boolean;
}

const CLOUD_COLORS: Record<string, string> = {
  google: "from-blue-400 to-blue-600",
  onedrive: "from-sky-400 to-sky-600",
  dropbox: "from-indigo-400 to-indigo-600",
  icloud: "from-cyan-400 to-cyan-600",
  unknown: "from-gray-400 to-gray-600",
};

export default function CloudDrives() {
  const [drives, setDrives] = useState<CloudDrive[]>([]);
  const [syncProcesses, setSyncProcesses] = useState<SyncProcess[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/drives").then(r => r.json()).then(d => {
      setDrives(d.drives || []);
      setSyncProcesses(d.syncProcesses || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="glass-card p-6 animate-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <Cloud size={16} className="text-white" />
          </div>
          <h2 className="text-base font-semibold">클라우드 드라이브</h2>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {drives.length === 0 && !loading ? (
        <div className="flex flex-col items-center gap-3 py-8 text-[var(--text-secondary)]">
          <CloudOff size={32} />
          <p className="text-sm">연결된 클라우드 드라이브 없음</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drives.map(d => (
            <div key={d.path} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02]">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CLOUD_COLORS[d.type]} flex items-center justify-center`}>
                <Cloud size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{d.path}</p>
              </div>
              <span className="pill-badge pill-green">연결됨</span>
            </div>
          ))}
        </div>
      )}

      {syncProcesses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">동기화 프로세스</p>
          <div className="flex flex-wrap gap-2">
            {syncProcesses.map(sp => (
              <span key={sp.name} className={`pill-badge ${sp.running ? "pill-green" : "pill-gray"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sp.running ? "bg-green-500" : "bg-gray-400"}`} />
                {sp.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
