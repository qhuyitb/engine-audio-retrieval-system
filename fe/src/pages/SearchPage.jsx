import { useState, useRef } from "react";
import { searchAudio } from "../api/client";

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

export default function SearchPage() {
  const [file, setFile] = useState(null);
  const [topK, setTopK] = useState(5);
  const [filterClass, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
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

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Steps toggle */}
          <div className="border border-[#2a2a2a]">
            <button
              onClick={() => setStepsOpen((o) => !o)}
              className="w-full flex justify-between items-center px-5 py-3 text-xs tracking-widest uppercase text-[#555] hover:text-[#e8e4dc] transition-colors"
            >
              <span>Intermediate Steps ({result.steps?.length ?? 0})</span>
              <span>{stepsOpen ? "−" : "+"}</span>
            </button>
            {stepsOpen && (
              <div className="border-t border-[#2a2a2a] px-5 py-4 space-y-3">
                {result.steps?.map((step, i) => (
                  <div key={i} className="text-xs text-[#666]">
                    <span className="text-[#444] mr-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#888]">
                      {step.step ?? JSON.stringify(step)}
                    </span>
                    {step.value !== undefined && (
                      <span className="ml-2 text-[#555]">
                        → {JSON.stringify(step.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top results */}
          <div>
            <p className="text-[10px] tracking-widest text-[#555] uppercase mb-3">
              Results
            </p>
            <div className="space-y-2">
              {result.results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-5 px-5 py-4 border border-[#1e1e1e] hover:border-[#333] transition-colors"
                >
                  {/* Rank */}
                  <span className="text-2xl font-bold text-[#2a2a2a] w-8 shrink-0">
                    {item.rank}
                  </span>
                  {/* Score bar */}
                  <div className="w-24 shrink-0">
                    <div className="h-1 bg-[#1a1a1a] w-full">
                      <div
                        className="h-1 bg-[#e8e4dc]"
                        style={{ width: `${(item.score * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#555] mt-1">
                      {(item.score * 100).toFixed(1)}%
                    </p>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e4dc] truncate">
                      {item.filename}
                    </p>
                    <p className="text-xs text-[#555] mt-0.5">
                      {item.class_label} · {item.duration_sec?.toFixed(2)}s
                    </p>
                  </div>
                  <span className="text-[10px] text-[#333] shrink-0">
                    id:{item.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
