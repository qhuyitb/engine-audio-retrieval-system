// pages/ExplorerPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchAudioList,
  fetchAudioById,
  deleteAudio,
  fetchStats,
} from "../api/client";

const BASE = "http://localhost:8000";
const CLASS_OPTIONS = [
  "",
  "airplane",
  "car",
  "train",
  "helicopter",
  "motorcycle",
  "truck",
  "boat",
  "bus",
];
const PAGE_SIZE = 20;

function AudioPlayer({ id }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const toggle = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };
  return (
    <div className="flex items-center">
      <button
        onClick={toggle}
        className="w-8 h-8 border border-gray-300 text-blue-600 hover:text-black hover:border-blue-500 text-sm transition-all flex items-center justify-center rounded"
      >
        {playing ? "■" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={`${BASE}/api/audio/${id}/stream`}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

export default function ExplorerPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterClass, setFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDL] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, s] = await Promise.all([
        fetchAudioList({
          class_label: filterClass || undefined,
          limit: PAGE_SIZE,
          offset,
        }),
        fetchStats(),
      ]);
      setItems(data);
      setStats(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterClass, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = (v) => {
    setFilter(v);
    setOffset(0);
  };
  const openDetail = async (id) => {
    setDL(true);
    setSelected(null);
    try {
      setSelected(await fetchAudioById(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDL(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAudio(deleteId);
      setDeleteId(null);
      setSelected(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const displayCount =
    filterClass && stats
      ? (stats.by_class?.[filterClass] ?? 0)
      : (stats?.total ?? 0);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Explorer</h2>
          <p className="text-gray-600 text-base">
            Browse and manage audio files in the database.
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">{displayCount}</p>
            <p className="text-xs tracking-wider text-gray-500 uppercase mt-1">
              {filterClass ? `files · ${filterClass}` : "files in database"}
            </p>
            <p className="text-xs text-gray-400 uppercase">
              showing {offset + 1}–{offset + items.length}
            </p>
          </div>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleFilterChange("")}
            className={`px-4 py-2 text-xs tracking-wider uppercase font-medium transition-colors ${filterClass === "" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            All ({stats.total})
          </button>
          {Object.entries(stats.by_class ?? {})
            .sort(([, a], [, b]) => b - a)
            .map(([cls, count]) => (
              <button
                key={cls}
                onClick={() => handleFilterChange(cls)}
                className={`px-4 py-2 text-xs tracking-wider uppercase font-medium ${filterClass === cls ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                {cls} ({count})
              </button>
            ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={load}
          className="px-5 py-2 border border-gray-300 text-sm uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm uppercase tracking-wider">
          Loading...
        </div>
      ) : (
        <div className="border border-gray-200 bg-white rounded shadow-sm">
          <div className="grid grid-cols-[3rem_1fr_8rem_6rem_5rem_6rem] border-b border-gray-200 px-5 py-3 bg-gray-50">
            {["ID", "Filename", "Class", "Duration", "Play", ""].map((h) => (
              <span
                key={h}
                className="text-xs tracking-wider text-gray-600 uppercase font-semibold"
              >
                {h}
              </span>
            ))}
          </div>
          {items.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              No files found.
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[3rem_1fr_8rem_6rem_5rem_6rem] px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
            >
              <span className="text-sm text-gray-500">{item.id}</span>
              <span className="text-base text-gray-900 truncate pr-4">
                {item.filename}
              </span>
              <span className="text-sm text-gray-700">{item.class_label}</span>
              <span className="text-sm text-gray-700">
                {item.duration_sec?.toFixed(2)}s
              </span>
              <AudioPlayer id={item.id} />
              <div className="flex gap-4">
                <button
                  onClick={() => openDetail(item.id)}
                  className="text-xs tracking-wider text-blue-600 hover:text-black uppercase"
                >
                  View
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-xs tracking-wider text-gray-600 hover:text-red-600 uppercase"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 justify-end items-center">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          disabled={offset === 0}
          className="px-5 py-2 text-sm uppercase tracking-wider text-gray-700 hover:text-black disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          {offset + 1} – {offset + items.length}
        </span>
        <button
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
          disabled={items.length < PAGE_SIZE}
          className="px-5 py-2 text-sm uppercase tracking-wider text-gray-700 hover:text-black disabled:opacity-30"
        >
          Next
        </button>
      </div>

      {/* Detail Modal */}
      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white border border-gray-300 p-8 w-full max-w-md shadow-xl rounded"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : (
              selected && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-xs tracking-wider text-gray-500 uppercase">
                      Audio Detail
                    </p>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-gray-500 hover:text-black"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-4 mb-6">
                    {[
                      ["ID", selected.id],
                      ["Filename", selected.filename],
                      ["Class", selected.class_label],
                      ["Duration", `${selected.duration_sec?.toFixed(3)}s`],
                      ["Sample Rate", `${selected.sample_rate} Hz`],
                      ["Created", selected.created_at ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-5 text-base">
                        <span className="text-blue-600 w-28 shrink-0 text-sm uppercase tracking-wider">
                          {k}
                        </span>
                        <span className="text-gray-900 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mb-6 pt-4 border-t border-gray-200">
                    <span className="text-xs tracking-wider text-gray-500 uppercase">
                      Preview
                    </span>
                    <AudioPlayer id={selected.id} />
                  </div>
                  <button
                    onClick={() => setDeleteId(selected.id)}
                    className="px-5 py-2 border border-red-700 text-red-700 text-sm uppercase tracking-wider hover:bg-red-50"
                  >
                    Delete this file
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 p-8 w-full max-w-md text-center space-y-5 shadow-xl">
            <p className="text-base text-gray-900">Delete id={deleteId}?</p>
            <p className="text-sm text-gray-600">
              This will remove the point from Qdrant permanently.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-6 py-2 border border-gray-300 text-sm uppercase tracking-wider text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-700 text-white text-sm uppercase tracking-wider hover:bg-red-800"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
