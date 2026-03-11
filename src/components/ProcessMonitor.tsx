"use client";

import { useEffect, useState } from "react";
import { Activity, Server, Shield, AppWindow, Cog, X, RefreshCw } from "lucide-react";

interface Process {
  pid: number;
  name: string;
  memMB: number;
  port: number | null;
  type: "server" | "app" | "security" | "system" | "background";
  description: string;
}

const TYPE_CONFIG = {
  server: { icon: Server, color: "pill-blue", label: "서버" },
  security: { icon: Shield, color: "pill-yellow", label: "보안" },
  app: { icon: AppWindow, color: "pill-green", label: "앱" },
  system: { icon: Cog, color: "pill-gray", label: "시스템" },
  background: { icon: Activity, color: "pill-gray", label: "백그라운드" },
};

export default function ProcessMonitor() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/processes").then(r => r.json()).then(d => {
      setProcesses(d.processes || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const killProcess = async (pid: number) => {
    if (!confirm(`PID ${pid} 프로세스를 종료하시겠습니까?`)) return;
    setKilling(pid);
    try {
      await fetch("/api/processes", { method: "DELETE", body: JSON.stringify({ pid }), headers: { "Content-Type": "application/json" } });
      setTimeout(load, 1000);
    } catch { /* ignore */ }
    setKilling(null);
  };

  const filtered = filter === "all" ? processes : processes.filter(p => p.type === filter);
  const counts = {
    all: processes.length,
    server: processes.filter(p => p.type === "server").length,
    security: processes.filter(p => p.type === "security").length,
    app: processes.filter(p => p.type === "app").length,
  };

  return (
    <div className="glass-card p-6 animate-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <h2 className="text-base font-semibold">실행 중인 프로세스</h2>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {(["all", "server", "security", "app"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              filter === f
                ? "bg-[var(--accent)] text-white"
                : "bg-black/5 text-[var(--text-secondary)] hover:bg-black/10"
            }`}
          >
            {f === "all" ? "전체" : TYPE_CONFIG[f].label} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-hide">
        {filtered.map(p => {
          const cfg = TYPE_CONFIG[p.type];
          const Icon = cfg.icon;
          return (
            <div key={`${p.pid}-${p.name}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] transition-colors group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Icon size={14} className="text-[var(--text-secondary)] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{p.description}</span>
                    <span className={`pill-badge ${cfg.color}`}>{cfg.label}</span>
                    {p.port && <span className="pill-badge pill-blue">:{p.port}</span>}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {p.name} · PID {p.pid} · {p.memMB}MB
                  </span>
                </div>
              </div>
              {p.type !== "system" && (
                <button
                  onClick={() => killProcess(p.pid)}
                  disabled={killing === p.pid}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-[var(--danger)] transition-all shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--text-secondary)] py-8">프로세스 없음</p>
        )}
      </div>
    </div>
  );
}
