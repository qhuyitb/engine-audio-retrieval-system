// App.jsx
import { useState } from "react";
import ExplorerPage from "./pages/ExplorerPage";
import SearchPage from "./pages/SearchPage";
import StatsPage from "./pages/StatsPage";
import EvaluationPage from "./pages/EvaluationPage";

const TABS = [
  { id: "search", label: "Search" },
  { id: "explorer", label: "Explorer" },
  { id: "stats", label: "Stats" },
  { id: "evaluation", label: "Evaluation" },
];

export default function App() {
  const [tab, setTab] = useState("search");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header className="border-b border-gray-200 px-8 py-6 flex items-center justify-between bg-white shadow-sm">
        <div>
          <p className="text-xs tracking-widest text-gray-500 uppercase mb-1">
            Multimedia Database
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Engine Audio Retrieval
          </h1>
        </div>
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 text-sm tracking-wider uppercase font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:text-black hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {tab === "search" && <SearchPage />}
        {tab === "explorer" && <ExplorerPage />}
        {tab === "stats" && <StatsPage />}
        {tab === "evaluation" && <EvaluationPage />}
      </main>
    </div>
  );
}
