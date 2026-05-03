// pages/SearchPage.jsx
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
        className="w-8 h-8 border border-gray-300 text-blue-600 hover:text-black hover:border-blue-500 text-sm rounded flex items-center justify-center transition-all"
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
      <div className="space-y-1 mt-1">
        {Object.entries(v).map(([sk, sv]) => (
          <div key={sk} className="flex gap-3">
            <span className="text-blue-600 shrink-0 text-sm">{sk}:</span>
            <span className="text-gray-700">
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
    <div className="border-l-2 border-gray-300 pl-5">
      <p className="text-sm text-blue-700 font-bold mb-2 uppercase tracking-wider">
        [{step.step}]
      </p>
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-4 text-sm">
            <span className="text-gray-600 w-36 shrink-0">{k}</span>
            <span className="text-gray-800">{renderValue(v)}</span>
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
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Similarity Search
        </h2>
        <p className="text-gray-600 text-base">
          Upload a .wav file — returns the top matching engines from the
          database.
        </p>
      </div>

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
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer px-8 py-16 text-center ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
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
            <p className="text-gray-900 font-bold text-base">{file.name}</p>
            <p className="text-gray-500 text-sm mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 text-sm tracking-wider uppercase">
              Drop .wav here
            </p>
            <p className="text-gray-400 text-xs mt-2">or click to browse</p>
          </div>
        )}
      </div>

      <div className="flex gap-6 items-end flex-wrap">
        <div>
          <label className="text-xs tracking-wider text-gray-600 uppercase block mb-1">
            Top K
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="bg-white border border-gray-300 text-gray-900 px-4 py-2 w-24 text-base focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs tracking-wider text-gray-600 uppercase block mb-1">
            Filter Class
          </label>
          <select
            value={filterClass}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 px-4 py-2 text-base focus:outline-none focus:border-blue-500"
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
          className="px-8 py-2 bg-blue-600 text-white text-sm font-bold tracking-wider uppercase disabled:opacity-40 hover:bg-blue-700 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="space-y-8">
          <div className="border border-gray-200 bg-white rounded shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <p className="text-xs tracking-wider text-gray-600 uppercase font-semibold">
                Query
              </p>
            </div>
            <div className="px-6 py-5 flex flex-wrap gap-x-10 gap-y-2 text-sm">
              <div className="flex gap-4">
                <span className="text-gray-500 uppercase tracking-wider">
                  File
                </span>
                <span className="text-gray-900">
                  {result.query?.filename ?? file.name}
                </span>
              </div>
              {result.query?.duration !== undefined && (
                <div className="flex gap-4">
                  <span className="text-gray-500 uppercase tracking-wider">
                    Duration
                  </span>
                  <span className="text-gray-900">
                    {result.query.duration}s
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 bg-white rounded shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <p className="text-xs tracking-wider text-gray-600 uppercase font-semibold">
                Intermediate Steps ({result.steps?.length ?? 0})
              </p>
            </div>
            <div className="px-6 py-6 space-y-6">
              {result.steps?.map((step, i) => (
                <StepBlock key={i} step={step} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-wider text-gray-600 uppercase mb-4 font-semibold">
              Top {result.results.length} Results
            </p>
            <div className="space-y-3">
              {result.results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-5 px-6 py-4 border border-gray-200 hover:border-blue-400 hover:bg-gray-50 transition-colors bg-white rounded shadow-sm"
                >
                  <span className="text-2xl font-bold text-gray-400 w-10 shrink-0">
                    {item.rank}
                  </span>
                  <div className="w-32 shrink-0">
                    <div className="h-1 bg-gray-200 w-full rounded">
                      <div
                        className="h-1 bg-blue-600 rounded"
                        style={{ width: `${(item.score * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {(item.score * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-gray-900 truncate">
                      {item.filename}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
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
