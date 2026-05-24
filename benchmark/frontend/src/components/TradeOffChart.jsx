import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts'

const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']
const COLORS = {
  'YOLOv8': '#737373',
  'RT-DETR': '#737373',
  'NMS Ensemble': '#f5f5f5',
  'WBF Ensemble': '#f5f5f5',
}

const LABEL_OFFSETS = {
  'NMS Ensemble': { x: -10, y: -23 },
  'WBF Ensemble': { x: 12, y: -10 },
}

const CustomDot = ({ cx, cy, payload }) => {
  const offset = LABEL_OFFSETS[payload.name] ?? { x: 0, y: -17 }

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={COLORS[payload.name]}
      stroke="#050505"
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill="transparent"
        stroke={COLORS[payload.name]}
        strokeWidth={2}
      />
      <text
        x={cx + offset.x}
        y={cy + offset.y}
        textAnchor="middle"
        fill={COLORS[payload.name]}
        fontSize={11}
        fontWeight="700"
      >
        {payload.name.replace(' Ensemble', '')}
      </text>
    </g>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-neutral-700 bg-[#0b0b0b] px-3 py-2">
      <p className="mb-1 text-sm font-bold" style={{ color: COLORS[p.name] }}>{p.name}</p>
      <p className="m-0 text-xs font-semibold text-neutral-100">FPS: {p.x.toFixed(1)}</p>
      <p className="m-0 mt-0.5 text-xs font-semibold text-neutral-100">mAP@0.5: {(p.y * 100).toFixed(1)}%</p>
    </div>
  )
}

export default function TradeOffChart({ results }) {
  const allFps = CONFIGS.map(c => results[c]?.fps ?? 0)
  const midFps = (Math.min(...allFps) + Math.max(...allFps)) / 2

  const allMAP = CONFIGS.map(c => results[c]?.mAP50 ?? 0)
  const midMAP = (Math.min(...allMAP) + Math.max(...allMAP)) / 2

  const data = CONFIGS.map(config => ({
    x: results[config]?.fps ?? 0,
    y: results[config]?.mAP50 ?? 0,
    name: config,
  }))

  return (
    <div className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-4">
        <p className="panel-kicker">Balance</p>
        <h2 className="panel-title mt-1">Speed vs Accuracy</h2>
      </div>

      <ResponsiveContainer width="100%" height={292}>
        <ScatterChart margin={{ top: 24, right: 24, bottom: 32, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="x"
            type="number"
            name="FPS"
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
          >
            <Label value="FPS" position="insideBottom" offset={-15} fill="#8a8a8a" fontSize={12} />
          </XAxis>
          <YAxis
            dataKey="y"
            type="number"
            name="mAP@0.5"
            domain={[0, 1]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          >
            <Label value="mAP@0.5" angle={-90} position="insideLeft" offset={12} fill="#8a8a8a" fontSize={12} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={midFps} stroke="#2a2a2a" strokeDasharray="4 4" />
          <ReferenceLine y={midMAP} stroke="#2a2a2a" strokeDasharray="4 4" />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {CONFIGS.map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[c] }} />
            <span className="text-xs text-neutral-500">{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
