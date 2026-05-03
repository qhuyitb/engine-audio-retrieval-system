import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Data từ docs ─────────────────────────────────────────────────
const SUMMARY_K = [
  { k: "K=1", precision: 90.0, recall: 0.91, map: 90.0 },
  { k: "K=5", precision: 85.1, recall: 4.3, map: 90.7 },
  { k: "K=10", precision: 81.9, recall: 8.27, map: 89.2 },
];

const BY_CLASS = [
  { cls: "airplane", p5: 82.6, ap5: 87.6 },
  { cls: "bicycle", p5: 97.6, ap5: 99.5 },
  { cls: "bus", p5: 98.8, ap5: 98.9 },
  { cls: "car", p5: 89.4, ap5: 93.8 },
  { cls: "helicopter", p5: 65.8, ap5: 82.2 },
  { cls: "motorcycle", p5: 85.2, ap5: 90.4 },
  { cls: "train", p5: 92.8, ap5: 93.4 },
  { cls: "truck", p5: 68.4, ap5: 79.3 },
];

const CONFUSION = {
  labels: ["plane", "bike", "bus", "car", "heli", "moto", "train", "truck"],
  matrix: [
    [82.6, 1.8, 1.8, 1.2, 3.8, 2.0, 0.6, 6.2],
    [0.2, 97.6, 0.0, 0.4, 1.2, 0.4, 0.0, 0.2],
    [1.0, 0.0, 98.8, 0.0, 0.0, 0.2, 0.0, 0.0],
    [2.6, 1.4, 0.0, 89.4, 1.8, 2.4, 0.0, 2.4],
    [3.8, 12.2, 2.8, 3.0, 65.8, 6.0, 0.8, 5.6],
    [1.8, 1.8, 2.6, 3.0, 2.0, 85.2, 2.0, 1.6],
    [0.8, 1.2, 0.2, 1.2, 0.8, 2.2, 92.8, 0.8],
    [8.4, 3.6, 2.4, 9.2, 5.0, 3.0, 0.0, 68.4],
  ],
};

const TOP_ERRORS = [
  {
    rank: 1,
    true_cls: "helicopter",
    pred_cls: "bicycle",
    pct: 12.2,
    reason: "Rotor tốc độ thấp → ZCR/tempo ≈ xe đạp điện",
  },
  {
    rank: 2,
    true_cls: "truck",
    pred_cls: "car",
    pct: 9.2,
    reason: "Truck nhẹ & SUV spectral centroid overlap",
  },
  {
    rank: 3,
    true_cls: "truck",
    pred_cls: "airplane",
    pct: 8.4,
    reason: "Diesel RPM cao → tần số cao ≈ turbine",
  },
  {
    rank: 4,
    true_cls: "airplane",
    pred_cls: "truck",
    pct: 6.2,
    reason: "Turbine thấp tần ≈ diesel nặng",
  },
  {
    rank: 5,
    true_cls: "helicopter",
    pred_cls: "motorcycle",
    pct: 6.0,
    reason: "Rotor percussive pattern ≈ động cơ xe máy",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <p className="text-[10px] tracking-widest text-[#555] uppercase whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-[#1e1e1e]" />
    </div>
  );
}

function barColor(val) {
  if (val >= 90) return "#6fdc6f";
  if (val >= 80) return "#e8e4dc";
  if (val >= 70) return "#ffd06b";
  return "#ff6b6b";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] px-3 py-2 text-xs">
      <p className="text-[#888] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}%
        </p>
      ))}
    </div>
  );
};

function cellBg(val, isDiag) {
  if (isDiag) {
    if (val >= 90) return "#1a3a1a";
    if (val >= 75) return "#2a3a1a";
    return "#3a2a1a";
  }
  if (val >= 5) return "#3a1a1a";
  if (val >= 2) return "#2a2010";
  return "transparent";
}
function cellFg(val, isDiag) {
  if (isDiag) return "#6fdc6f";
  if (val >= 5) return "#ff6b6b";
  if (val >= 2) return "#ffd06b";
  return "#333";
}

// ─── Page ─────────────────────────────────────────────────────────
export default function EvaluationPage() {
  return (
    <div className="space-y-14">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Evaluation</h2>
        <p className="text-[#555] text-sm">
          800 files · hand-crafted features · Cosine similarity · no deep
          learning
        </p>
      </div>

      {/* 1. Line chart P@K, MAP@K theo K */}
      <div>
        <SectionTitle>Precision@K · MAP@K · Recall@K theo K</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={SUMMARY_K}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />
            <XAxis
              dataKey="k"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#555" }} />
            <Line
              type="monotone"
              dataKey="precision"
              name="Precision@K"
              stroke="#e8e4dc"
              strokeWidth={2}
              dot={{ r: 4, fill: "#e8e4dc" }}
            />
            <Line
              type="monotone"
              dataKey="map"
              name="MAP@K"
              stroke="#6fdc6f"
              strokeWidth={2}
              dot={{ r: 4, fill: "#6fdc6f" }}
            />
            <Line
              type="monotone"
              dataKey="recall"
              name="Recall@K"
              stroke="#ffd06b"
              strokeWidth={2}
              dot={{ r: 4, fill: "#ffd06b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Bar chart P@5 theo class */}
      <div>
        <SectionTitle>Precision@5 theo class</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={BY_CLASS}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#1e1e1e"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="cls"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={85.1}
              stroke="#444"
              strokeDasharray="4 4"
              label={{
                value: "mean 85.1%",
                fill: "#444",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Bar
              dataKey="p5"
              name="P@5"
              radius={[2, 2, 0, 0]}
              label={{
                position: "top",
                fill: "#555",
                fontSize: 10,
                formatter: (v) => v.toFixed(1) + "%",
              }}
              isAnimationActive={true}
            >
              {BY_CLASS.map((d, i) => (
                <rect key={i} fill={barColor(d.p5)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Custom colored bars workaround */}
        <ResponsiveContainer width="100%" height={0}>
          <BarChart data={[]} />
        </ResponsiveContainer>
      </div>

      {/* 3. Bar chart AP@5 theo class */}
      <div>
        <SectionTitle>Average Precision@5 (AP@5) theo class</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={BY_CLASS}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#1e1e1e"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="cls"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[70, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="p5" name="P@5" fill="#666" radius={[2, 2, 0, 0]} />
            <Bar
              dataKey="ap5"
              name="AP@5"
              fill="#6fdc6f"
              radius={[2, 2, 0, 0]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#555" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Confusion matrix */}
      <div>
        <SectionTitle>Confusion Matrix @ K=5 (%)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="text-[11px] border-collapse w-full font-mono">
            <thead>
              <tr>
                <th className="text-[#444] text-left px-2 py-1 font-normal text-[10px] tracking-widest uppercase">
                  T\P
                </th>
                {CONFUSION.labels.map((l) => (
                  <th
                    key={l}
                    className="text-[#555] px-2 py-1 font-normal text-center min-w-[52px]"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONFUSION.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="text-[#777] px-2 py-1 font-bold">
                    {CONFUSION.labels[i]}
                  </td>
                  {row.map((val, j) => {
                    const isDiag = i === j;
                    return (
                      <td
                        key={j}
                        className="px-2 py-1 text-center"
                        style={{
                          background: cellBg(val, isDiag),
                          color: cellFg(val, isDiag),
                        }}
                      >
                        {val.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-5 mt-3 text-[10px] text-[#555]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-[#1a3a1a] mr-1" />
              Đúng class
            </span>
            <span className="flex items-center gap-1 text-[#ff6b6b]">
              <span className="inline-block w-3 h-3 bg-[#3a1a1a] mr-1" />
              Nhầm ≥5%
            </span>
            <span className="flex items-center gap-1 text-[#ffd06b]">
              <span className="inline-block w-3 h-3 bg-[#2a2010] mr-1" />
              Nhầm 2–5%
            </span>
          </div>
        </div>
      </div>

      {/* 5. Top errors */}
      <div>
        <SectionTitle>Top nhầm lẫn</SectionTitle>
        <div className="border border-[#1e1e1e]">
          <div className="grid grid-cols-[2rem_7rem_7rem_4rem_1fr] border-b border-[#1e1e1e] px-4 py-2 bg-[#111]">
            {["#", "True", "Dự đoán", "Tỉ lệ", "Lý do"].map((h) => (
              <span
                key={h}
                className="text-[10px] tracking-widest text-[#444] uppercase"
              >
                {h}
              </span>
            ))}
          </div>
          {TOP_ERRORS.map((e) => (
            <div
              key={e.rank}
              className="grid grid-cols-[2rem_7rem_7rem_4rem_1fr] px-4 py-3 border-b border-[#131313] hover:bg-[#141414] items-start transition-colors"
            >
              <span className="text-xs text-[#333]">{e.rank}</span>
              <span className="text-xs text-[#e8e4dc]">{e.true_cls}</span>
              <span className="text-xs text-[#ff6b6b]">{e.pred_cls}</span>
              <span className="text-xs text-[#ff6b6b] font-bold">{e.pct}%</span>
              <span className="text-xs text-[#555]">{e.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
