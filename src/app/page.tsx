"use client";

import SystemOverview from "@/components/SystemOverview";
import ProcessMonitor from "@/components/ProcessMonitor";
import FolderExplorer from "@/components/FolderExplorer";
import CloudDrives from "@/components/CloudDrives";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">OhMyComputer</h1>
              <p className="text-[11px] text-[var(--text-secondary)] -mt-0.5">System Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="pill-badge pill-green">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              실시간 모니터링
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SystemOverview />
          <ProcessMonitor />
          <FolderExplorer />
          <CloudDrives />
        </div>

        {/* Footer */}
        <div className="mt-8 mb-6 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            OhMyComputer v1.0 · 컴퓨터 최적화 & 모니터링 대시보드
          </p>
        </div>
      </main>
    </div>
  );
}
