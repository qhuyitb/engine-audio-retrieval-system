import { useState } from "react";
import ExplorerPage from "./pages/ExplorerPage";
import SearchPage from "./pages/SearchPage";
import StatsPage from "./pages/StatsPage";

const TABS = [
  { id: "search", label: "Search" },
  { id: "explorer", label: "Explorer" },
  { id: "stats", label: "Stats" },
];

export default function App() {
  const [tab, setTab] = useState("search");

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e8e4dc] font-mono">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#555] uppercase mb-1">
            Multimedia Database
          </p>
          <h1 className="text-lg font-bold tracking-tight text-[#e8e4dc]">
            Engine Audio Retrieval
          </h1>
        </div>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs tracking-widest uppercase transition-all duration-200 ${
                tab === t.id
                  ? "bg-[#e8e4dc] text-[#0e0e0e] font-bold"
                  : "text-[#555] hover:text-[#e8e4dc] hover:bg-[#1a1a1a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Page */}
      <main className="max-w-5xl mx-auto px-8 py-10">
        {tab === "search" && <SearchPage />}
        {tab === "explorer" && <ExplorerPage />}
        {tab === "stats" && <StatsPage />}
      </main>
    </div>
  );
}
