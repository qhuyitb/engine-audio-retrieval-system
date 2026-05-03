// pages/StatsPage.jsx
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
          <h2 className="text-3xl font-bold tracking-tight mb-2">Stats</h2>
          <p className="text-gray-600 text-base">
            Dataset overview and collection health.
          </p>
        </div>
        <button
          onClick={load}
          className="px-5 py-2 border border-gray-300 text-sm uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && (
        <div className="py-20 text-center text-gray-500 text-sm uppercase tracking-wider">
          Loading...
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          <div className="border border-gray-200 px-8 py-6 flex gap-12 items-end bg-white rounded shadow-sm">
            <div>
              <p className="text-xs tracking-wider text-gray-500 uppercase mb-1">
                Total Files
              </p>
              <p className="text-5xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs tracking-wider text-gray-500 uppercase mb-1">
                Classes
              </p>
              <p className="text-5xl font-bold text-gray-900">
                {Object.keys(stats.by_class ?? {}).length}
              </p>
            </div>
          </div>

          <div className="border border-gray-200 px-8 py-6 bg-white rounded shadow-sm">
            <p className="text-xs tracking-wider text-gray-500 uppercase mb-6 font-semibold">
              Files by Class
            </p>
            <div className="space-y-4">
              {Object.entries(stats.by_class ?? {})
                .sort(([, a], [, b]) => b - a)
                .map(([cls, count]) => (
                  <div key={cls} className="flex items-center gap-5">
                    <span className="text-sm text-gray-700 w-28 shrink-0 truncate font-medium">
                      {cls}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxVal) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700 w-12 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {collection && (
        <div className="border border-gray-200 px-8 py-6 bg-white rounded shadow-sm">
          <p className="text-xs tracking-wider text-gray-500 uppercase mb-6 font-semibold">
            Qdrant Collection
          </p>
          <div className="space-y-3">
            {Object.entries(collection).map(([k, v]) => (
              <div key={k} className="flex gap-5 text-sm">
                <span className="text-gray-600 w-44 shrink-0 text-xs uppercase tracking-wider">
                  {k}
                </span>
                <span className="text-gray-800 break-all">
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
