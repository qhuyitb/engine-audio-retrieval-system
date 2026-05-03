import { useState, useRef } from "react";
import { searchAudio } from "../api/client";

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

function AudioPlayer({ id }) {
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
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

function renderValue(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number")
    return Number.isInteger(v) ? String(v) : v.toFixed(4);
  if (typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    return (
      <div className="space-y-0.5 mt-0.5">
        {Object.entries(v).map(([sk, sv]) => (
          <div key={sk} className="flex gap-2">
            <span className="text-[#444] shrink-0">{sk}:</span>
            <span className="text-[#666]">
              {typeof sv === "number"
                ? Number.isInteger(sv)
                  ? sv
                  : sv.toFixed(4)
                : String(sv)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return String(v);
}

function StepBlock({ step }) {
  const entries = Object.entries(step).filter(([k]) => k !== "step");
  return (
    <div className="border-l-2 border-[#2a2a2a] pl-4">
      <p className="text-[11px] text-[#aaa] font-bold mb-2 uppercase tracking-widest">
        [{step.step}]
      </p>
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-3 text-xs">
            <span className="text-[#555] w-32 shrink-0">{k}</span>
            <span className="text-[#777]">{renderValue(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [file, setFile] = useState(null);
  const [topK, setTopK] = useState(5);
  const [filterClass, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (f && f.name.endsWith(".wav")) {
      setFile(f);
      setError(null);
    } else setError("Chỉ hỗ trợ file .wav");
  };

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchAudio({
        file,
        top_k: topK,
        filter_class: filterClass || undefined,
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Similarity Search
        </h2>
        <p className="text-[#555] text-sm">
          Upload a .wav file — returns the top matching engines from the
          database.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer px-8 py-14 text-center ${
          dragging
            ? "border-[#e8e4dc] bg-[#1a1a1a]"
            : "border-[#2a2a2a] hover:border-[#444]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".wav"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <p className="text-[#e8e4dc] font-bold text-sm">{file.name}</p>
            <p className="text-[#555] text-xs mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[#444] text-sm tracking-widest uppercase">
              Drop .wav here
            </p>
            <p className="text-[#333] text-xs mt-2">or click to browse</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest text-[#555] uppercase">
            Top K
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e4dc] px-3 py-2 w-20 text-sm focus:outline-none focus:border-[#555]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] tracking-widest text-[#555] uppercase">
            Filter Class
          </label>
          <select
            value={filterClass}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e4dc] px-3 py-2 text-sm focus:outline-none focus:border-[#555]"
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c || "All classes"}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={!file || loading}
          className="px-6 py-2 bg-[#e8e4dc] text-[#0e0e0e] text-xs font-bold tracking-widest uppercase disabled:opacity-30 hover:bg-white transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-6">
          {/* QUERY */}
          <div className="border border-[#1e1e1e]">
            <div className="px-5 py-3 border-b border-[#1e1e1e]">
              <p className="text-[10px] tracking-widest text-[#555] uppercase">
                Query
              </p>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-x-8 gap-y-1 text-xs">
              <div className="flex gap-3">
                <span className="text-[#444] uppercase tracking-widest">
                  File
                </span>
                <span className="text-[#999]">
                  {result.query?.filename ?? file.name}
                </span>
              </div>
              {result.query?.duration !== undefined && (
                <div className="flex gap-3">
                  <span className="text-[#444] uppercase tracking-widest">
                    Duration
                  </span>
                  <span className="text-[#999]">{result.query.duration}s</span>
                </div>
              )}
            </div>
          </div>

          {/* INTERMEDIATE STEPS */}
          <div className="border border-[#2a2a2a]">
            <div className="px-5 py-3 border-b border-[#2a2a2a]">
              <p className="text-[10px] tracking-widest text-[#555] uppercase">
                Intermediate Steps ({result.steps?.length ?? 0})
              </p>
            </div>
            <div className="px-5 py-5 space-y-6">
              {result.steps?.map((step, i) => (
                <StepBlock key={i} step={step} />
              ))}
            </div>
          </div>

          {/* TOP K RESULTS */}
          <div>
            <p className="text-[10px] tracking-widest text-[#555] uppercase mb-3">
              Top {result.results.length} Results
            </p>
            <div className="space-y-2">
              {result.results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-5 px-5 py-4 border border-[#1e1e1e] hover:border-[#333] transition-colors"
                >
                  <span className="text-2xl font-bold text-[#2a2a2a] w-8 shrink-0">
                    {item.rank}
                  </span>
                  <div className="w-28 shrink-0">
                    <div className="h-[2px] bg-[#1a1a1a] w-full">
                      <div
                        className="h-[2px] bg-[#e8e4dc]"
                        style={{ width: `${(item.score * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#555] mt-1">
                      {(item.score * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e4dc] truncate">
                      {item.filename}
                    </p>
                    <p className="text-xs text-[#555] mt-0.5">
                      {item.class_label} · {item.duration_sec?.toFixed(2)}s ·
                      id:{item.id}
                    </p>
                  </div>
                  <AudioPlayer id={item.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
