import { useState, useEffect } from "react";
import { fetchStats, fetchCollectionInfo } from "../api/client";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [collection, setColl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([fetchStats(), fetchCollectionInfo()]);
      setStats(s);
      setColl(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const maxVal = stats
    ? Math.max(...Object.values(stats.by_class ?? {}), 1)
    : 1;

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Stats</h2>
          <p className="text-[#555] text-sm">
            Dataset overview and collection health.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 border border-[#2a2a2a] text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc] hover:border-[#444] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading && (
        <div className="py-16 text-center text-[#333] text-sm tracking-widest uppercase">
          Loading...
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* Total */}
          <div className="border border-[#1e1e1e] px-6 py-5 flex gap-8 items-end">
            <div>
              <p className="text-[10px] tracking-widest text-[#555] uppercase mb-1">
                Total Files
              </p>
              <p className="text-4xl font-bold text-[#e8e4dc]">{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-widest text-[#555] uppercase mb-1">
                Classes
              </p>
              <p className="text-4xl font-bold text-[#e8e4dc]">
                {Object.keys(stats.by_class ?? {}).length}
              </p>
            </div>
          </div>

          {/* By class bar chart */}
          <div className="border border-[#1e1e1e] px-6 py-5">
            <p className="text-[10px] tracking-widest text-[#555] uppercase mb-5">
              Files by Class
            </p>
            <div className="space-y-3">
              {Object.entries(stats.by_class ?? {})
                .sort(([, a], [, b]) => b - a)
                .map(([cls, count]) => (
                  <div key={cls} className="flex items-center gap-4">
                    <span className="text-xs text-[#666] w-24 shrink-0 truncate">
                      {cls}
                    </span>
                    <div className="flex-1 h-1 bg-[#1a1a1a]">
                      <div
                        className="h-1 bg-[#e8e4dc] transition-all duration-500"
                        style={{ width: `${(count / maxVal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#555] w-10 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Collection info */}
      {collection && (
        <div className="border border-[#1e1e1e] px-6 py-5">
          <p className="text-[10px] tracking-widest text-[#555] uppercase mb-5">
            Qdrant Collection
          </p>
          <div className="space-y-2">
            {Object.entries(collection).map(([k, v]) => (
              <div key={k} className="flex gap-4 text-sm">
                <span className="text-[#444] w-40 shrink-0 text-xs uppercase tracking-widest">
                  {k}
                </span>
                <span className="text-[#888] break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
