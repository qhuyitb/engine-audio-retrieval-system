// pages/EvaluationPage.jsx
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

// Data
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

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <p className="text-xs tracking-widest text-gray-500 uppercase whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function barColor(val) {
  if (val >= 90) return "#1E7E34"; // dark green
  if (val >= 80) return "#2C6FB7"; // strong blue
  if (val >= 70) return "#E68A2E"; // orange
  return "#C92A2A"; // red
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-300 px-4 py-2 text-sm shadow-md rounded">
      <p className="text-gray-700 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-sm">
          {p.name}: {p.value.toFixed(1)}%
        </p>
      ))}
    </div>
  );
};

function cellBg(val, isDiag) {
  if (isDiag) {
    if (val >= 90) return "#D8F0D8";
    if (val >= 75) return "#E8F5E9";
    return "#FFF3E0";
  }
  if (val >= 5) return "#FFE5E5";
  if (val >= 2) return "#FFF0D8";
  return "transparent";
}
function cellFg(val, isDiag) {
  if (isDiag) return "#1B5E20";
  if (val >= 5) return "#B71C1C";
  if (val >= 2) return "#E65100";
  return "#4A4A4A";
}

export default function EvaluationPage() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Evaluation</h2>
        <p className="text-gray-600 text-base">
          800 files · hand-crafted features · Cosine similarity · no deep
          learning
        </p>
      </div>

      {/* Line chart */}
      <div>
        <SectionTitle>Precision@K · MAP@K · Recall@K theo K</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={SUMMARY_K}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid stroke="#E0E0E0" strokeDasharray="3 3" />
            <XAxis
              dataKey="k"
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13, color: "#333" }} />
            <Line
              type="monotone"
              dataKey="precision"
              name="Precision@K"
              stroke="#1F4E79"
              strokeWidth={3}
              dot={{ r: 5, fill: "#1F4E79" }}
            />
            <Line
              type="monotone"
              dataKey="map"
              name="MAP@K"
              stroke="#2C6E2C"
              strokeWidth={3}
              dot={{ r: 5, fill: "#2C6E2C" }}
            />
            <Line
              type="monotone"
              dataKey="recall"
              name="Recall@K"
              stroke="#D97706"
              strokeWidth={3}
              dot={{ r: 5, fill: "#D97706" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart P@5 */}
      <div>
        <SectionTitle>Precision@5 theo class</SectionTitle>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={BY_CLASS}
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E0E0E0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="cls"
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={85.1}
              stroke="#777"
              strokeDasharray="4 4"
              label={{
                value: "mean 85.1%",
                fill: "#555",
                fontSize: 12,
                position: "insideTopRight",
              }}
            />
            <Bar
              dataKey="p5"
              name="P@5"
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                fill: "#1F1F1F",
                fontSize: 12,
                fontWeight: "bold",
                formatter: (v) => v.toFixed(1) + "%",
              }}
            >
              {BY_CLASS.map((entry, index) => (
                <Bar
                  key={`bar-${index}`}
                  dataKey="p5"
                  fill={barColor(entry.p5)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AP@5 */}
      <div>
        <SectionTitle>Average Precision@5 (AP@5) theo class</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={BY_CLASS}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#E0E0E0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="cls"
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#333", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
              domain={[70, 100]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="p5" name="P@5" fill="#A0A0A0" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="ap5"
              name="AP@5"
              fill="#2C7A47"
              radius={[4, 4, 0, 0]}
            />
            <Legend wrapperStyle={{ fontSize: 13, color: "#333" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Confusion Matrix */}
      <div>
        <SectionTitle>Confusion Matrix @ K=5 (%)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full font-mono bg-white shadow-sm">
            <thead>
              <tr>
                <th className="text-gray-700 text-left px-3 py-2 font-semibold border border-gray-300 bg-gray-50">
                  T\P
                </th>
                {CONFUSION.labels.map((l) => (
                  <th
                    key={l}
                    className="text-gray-700 px-3 py-2 font-semibold text-center min-w-[56px] border border-gray-300 bg-gray-50"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONFUSION.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="text-gray-800 px-3 py-2 font-bold border border-gray-300 bg-gray-50">
                    {CONFUSION.labels[i]}
                  </td>
                  {row.map((val, j) => {
                    const isDiag = i === j;
                    return (
                      <td
                        key={j}
                        className="px-3 py-2 text-center border border-gray-300"
                        style={{
                          background: cellBg(val, isDiag),
                          color: cellFg(val, isDiag),
                          fontWeight: isDiag ? 600 : 400,
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
          <div className="flex gap-6 mt-4 text-xs text-gray-700">
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-[#D8F0D8] border border-green-700"></span>{" "}
              Đúng class
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-[#FFE5E5] border border-red-700"></span>{" "}
              Nhầm ≥5%
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 bg-[#FFF0D8] border border-orange-700"></span>{" "}
              Nhầm 2–5%
            </span>
          </div>
        </div>
      </div>

      {/* Top errors */}
      <div>
        <SectionTitle>Top nhầm lẫn</SectionTitle>
        <div className="border border-gray-200 bg-white rounded">
          <div className="grid grid-cols-[2rem_7rem_7rem_5rem_1fr] border-b border-gray-200 px-5 py-3 bg-gray-50">
            {["#", "True", "Dự đoán", "Tỉ lệ", "Lý do"].map((h) => (
              <span
                key={h}
                className="text-xs tracking-wider text-gray-600 uppercase font-semibold"
              >
                {h}
              </span>
            ))}
          </div>
          {TOP_ERRORS.map((e) => (
            <div
              key={e.rank}
              className="grid grid-cols-[2rem_7rem_7rem_5rem_1fr] px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-start"
            >
              <span className="text-sm text-gray-500 font-medium">
                {e.rank}
              </span>
              <span className="text-sm text-gray-900">{e.true_cls}</span>
              <span className="text-sm text-red-700 font-medium">
                {e.pred_cls}
              </span>
              <span className="text-sm text-red-700 font-bold">{e.pct}%</span>
              <span className="text-sm text-gray-700">{e.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
