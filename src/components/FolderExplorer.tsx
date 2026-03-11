"use client";

import { useEffect, useState } from "react";
import { Folder, FolderOpen, Trash2, RefreshCw, ChevronRight, Package, Database, FileCode } from "lucide-react";

interface FolderInfo {
  path: string;
  name: string;
  sizeMB: number;
  description: string;
  removable: boolean;
  type: "project" | "cache" | "system" | "unknown";
  lastModified: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  project: FileCode,
  cache: Database,
  system: Package,
  unknown: Folder,
};

export default function FolderExplorer() {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [scanPath, setScanPath] = useState("C:/Users/droli");
  const [inputPath, setInputPath] = useState("C:/Users/droli");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = (path?: string) => {
    setLoading(true);
    const p = path || scanPath;
    fetch(`/api/folders?path=${encodeURIComponent(p)}`).then(r => r.json()).then(d => {
      setFolders(d.folders || []);
      setScanPath(d.scanPath || p);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const navigate = (path: string) => {
    setInputPath(path);
    setScanPath(path);
    load(path);
  };

  const deleteFolder = async (path: string, name: string) => {
    if (!confirm(`"${name}" 폴더를 삭제하시겠습니까?\n경로: ${path}\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(path);
    try {
      const res = await fetch("/api/folders", { method: "DELETE", body: JSON.stringify({ path }), headers: { "Content-Type": "application/json" } });
      if (res.ok) load();
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const pathParts = scanPath.replace(/\\/g, "/").split("/").filter(Boolean);

  return (
    <div className="glass-card p-6 animate-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <FolderOpen size={16} className="text-white" />
          </div>
          <h2 className="text-base font-semibold">폴더 탐색기</h2>
        </div>
        <button onClick={() => load()} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide text-xs">
        {pathParts.map((part, i) => {
          const path = pathParts.slice(0, i + 1).join("/");
          return (
            <div key={path} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight size={10} className="text-[var(--text-secondary)]" />}
              <button
                onClick={() => navigate(path)}
                className="px-2 py-1 rounded-md hover:bg-black/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {part}
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom path input */}
      <div className="flex gap-2 mb-4">
        <input
          value={inputPath}
          onChange={e => setInputPath(e.target.value)}
          onKeyDown={e => e.key === "Enter" && navigate(inputPath)}
          className="flex-1 px-3 py-2 rounded-xl bg-black/[0.03] border border-[var(--border-color)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          placeholder="경로 입력..."
        />
        <button onClick={() => navigate(inputPath)} className="btn-primary text-xs">이동</button>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
        {folders.map(f => {
          const Icon = TYPE_ICONS[f.type] || Folder;
          const date = new Date(f.lastModified);
          const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
          return (
            <div
              key={f.path}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/[0.03] transition-colors group cursor-pointer"
              onClick={() => navigate(f.path)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Icon size={16} className={`shrink-0 ${
                  f.type === "project" ? "text-blue-500" :
                  f.type === "cache" ? "text-orange-400" :
                  "text-[var(--text-secondary)]"
                }`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{f.name}</span>
                    {f.removable && <span className="pill-badge pill-yellow">삭제 가능</span>}
                    {f.type === "project" && <span className="pill-badge pill-blue">프로젝트</span>}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {f.description} · {dateStr}
                  </span>
                </div>
              </div>
              {f.removable && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(f.path, f.name); }}
                  disabled={deleting === f.path}
                  className="opacity-0 group-hover:opacity-100 btn-danger text-xs transition-all shrink-0"
                >
                  {deleting === f.path ? "삭제 중..." : <Trash2 size={13} />}
                </button>
              )}
            </div>
          );
        })}
        {folders.length === 0 && !loading && (
          <p className="text-center text-sm text-[var(--text-secondary)] py-8">폴더 없음</p>
        )}
      </div>
    </div>
  );
}
