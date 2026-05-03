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
        className="w-7 h-7 border border-[#2a2a2a] text-[#888] hover:text-[#e8e4dc] hover:border-[#555] text-xs transition-colors flex items-center justify-center"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Explorer</h2>
          <p className="text-[#555] text-sm">
            Browse and manage audio files in the database.
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <p className="text-3xl font-bold text-[#e8e4dc]">{displayCount}</p>
            <p className="text-[10px] tracking-widest text-[#444] uppercase mt-0.5">
              {filterClass ? `files · ${filterClass}` : "files in database"}
            </p>
            <p className="text-[10px] tracking-widest text-[#333] uppercase">
              showing {offset + 1}–{offset + items.length}
            </p>
          </div>
        )}
      </div>

      {/* Class pills */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange("")}
            className={`px-3 py-1 text-[10px] tracking-widest uppercase transition-colors ${
              filterClass === ""
                ? "bg-[#e8e4dc] text-[#0e0e0e]"
                : "border border-[#2a2a2a] text-[#555] hover:text-[#e8e4dc]"
            }`}
          >
            All ({stats.total})
          </button>
          {Object.entries(stats.by_class ?? {})
            .sort(([, a], [, b]) => b - a)
            .map(([cls, count]) => (
              <button
                key={cls}
                onClick={() => handleFilterChange(cls)}
                className={`px-3 py-1 text-[10px] tracking-widest uppercase transition-colors ${
                  filterClass === cls
                    ? "bg-[#e8e4dc] text-[#0e0e0e]"
                    : "border border-[#2a2a2a] text-[#555] hover:text-[#e8e4dc]"
                }`}
              >
                {cls} ({count})
              </button>
            ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={load}
          className="px-4 py-2 border border-[#2a2a2a] text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc] hover:border-[#444] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <div className="py-16 text-center text-[#333] text-sm tracking-widest uppercase">
          Loading...
        </div>
      ) : (
        <div className="border border-[#1e1e1e]">
          <div className="grid grid-cols-[3rem_1fr_8rem_6rem_4rem_5rem] border-b border-[#1e1e1e] px-4 py-2">
            {["ID", "Filename", "Class", "Duration", "Play", ""].map((h, i) => (
              <span
                key={i}
                className="text-[10px] tracking-widest text-[#444] uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {items.length === 0 && (
            <div className="py-12 text-center text-[#333] text-sm">
              No files found.
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[3rem_1fr_8rem_6rem_4rem_5rem] px-4 py-3 border-b border-[#131313] hover:bg-[#141414] transition-colors items-center"
            >
              <span className="text-xs text-[#444]">{item.id}</span>
              <span className="text-sm text-[#e8e4dc] truncate pr-4">
                {item.filename}
              </span>
              <span className="text-xs text-[#666]">{item.class_label}</span>
              <span className="text-xs text-[#555]">
                {item.duration_sec?.toFixed(2)}s
              </span>
              <AudioPlayer id={item.id} />
              <div className="flex gap-3">
                <button
                  onClick={() => openDetail(item.id)}
                  className="text-[10px] tracking-widest text-[#555] hover:text-[#e8e4dc] uppercase transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-[10px] tracking-widest text-[#555] hover:text-red-400 uppercase transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-3 justify-end items-center">
        <button
          onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          disabled={offset === 0}
          className="px-4 py-2 text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc] disabled:opacity-20 transition-colors"
        >
          Prev
        </button>
        <span className="text-xs text-[#444]">
          {offset + 1} – {offset + items.length}
        </span>
        <button
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
          disabled={items.length < PAGE_SIZE}
          className="px-4 py-2 text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc] disabled:opacity-20 transition-colors"
        >
          Next
        </button>
      </div>

      {/* Detail modal */}
      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#111] border border-[#2a2a2a] p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <p className="text-[#444] text-sm tracking-widest uppercase">
                Loading...
              </p>
            ) : (
              selected && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-[10px] tracking-widest text-[#555] uppercase">
                      Audio Detail
                    </p>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-[#444] hover:text-[#e8e4dc]"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[
                      ["ID", selected.id],
                      ["Filename", selected.filename],
                      ["Class", selected.class_label],
                      ["Duration", `${selected.duration_sec?.toFixed(3)}s`],
                      ["Sample Rate", `${selected.sample_rate} Hz`],
                      ["Created", selected.created_at ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4 text-sm">
                        <span className="text-[#444] w-24 shrink-0 text-xs uppercase tracking-widest">
                          {k}
                        </span>
                        <span className="text-[#e8e4dc] break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-6 border-t border-[#1e1e1e] pt-4">
                    <span className="text-[10px] tracking-widest text-[#444] uppercase">
                      Preview
                    </span>
                    <AudioPlayer id={selected.id} />
                  </div>
                  <button
                    onClick={() => setDeleteId(selected.id)}
                    className="px-4 py-2 border border-red-900 text-red-500 text-xs tracking-widest uppercase hover:bg-red-900/20 transition-colors"
                  >
                    Delete this file
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#2a2a2a] p-8 w-full max-w-sm text-center space-y-5">
            <p className="text-sm text-[#e8e4dc]">Delete id={deleteId}?</p>
            <p className="text-xs text-[#555]">
              This will remove the point from Qdrant permanently.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 border border-[#2a2a2a] text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-900 text-red-200 text-xs tracking-widest uppercase hover:bg-red-800 transition-colors"
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
