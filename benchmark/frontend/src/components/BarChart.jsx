const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']

export default function BarChart({ results }) {
  const data = CONFIGS.map(config => ({
    name: config,
    value: results[config]?.mAP50 ?? 0,
  }))
  const best = Math.max(...data.map(item => item.value), 1)
  const bestName = data.reduce((bestItem, item) => item.value > bestItem.value ? item : bestItem, data[0])?.name

  return (
    <div className="panel min-w-0 p-4 sm:p-5">
      <div className="mb-5">
        <p className="panel-kicker">Accuracy</p>
        <h2 className="panel-title mt-1">mAP@0.5 Comparison</h2>
      </div>

      <div className="space-y-4">
        {data.map(item => {
          const percent = item.value * 100
          const width = `${Math.max(3, (item.value / best) * 100)}%`

          return (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${item.name === bestName ? 'bg-white' : 'bg-neutral-500'}`} />
                  <span className="truncate text-sm font-semibold text-neutral-300">{item.name}</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-neutral-100">{percent.toFixed(1)}%</span>
              </div>
              <div className="h-8 overflow-hidden rounded-lg border border-neutral-800 bg-[#0b0b0b]">
                <div
                  style={{ width }}
                  className={`flex h-full items-center justify-end rounded-md pr-2 transition-all duration-500 ${
                    item.name === bestName ? 'bg-white text-black' : 'bg-neutral-500 text-white'
                  }`}
                >
                  <span className="text-[0.68rem] font-bold">{percent.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
