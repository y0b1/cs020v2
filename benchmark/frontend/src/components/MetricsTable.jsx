const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']

const METRICS = [
  { key: 'precision', label: 'Precision', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'recall', label: 'Recall', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'f1', label: 'F1 Score', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'mAP50', label: 'mAP@0.5', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'mAP5095', label: 'mAP@[.5:.95]', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'temporal_consistency', label: 'Temporal Consistency', higherBetter: true, format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'avg_inference_ms', label: 'Inference (ms)', higherBetter: false, format: v => `${v.toFixed(1)} ms` },
  { key: 'fps', label: 'FPS', higherBetter: true, format: v => v.toFixed(1) },
]

export default function MetricsTable({ results }) {
  function getBestConfig(metricKey, higherBetter) {
    let best = null
    let bestVal = higherBetter ? -Infinity : Infinity
    for (const config of CONFIGS) {
      const val = results[config]?.[metricKey]
      if (val == null) continue
      if (higherBetter ? val > bestVal : val < bestVal) {
        bestVal = val
        best = config
      }
    }
    return best
  }

  return (
    <div className="panel min-w-0 overflow-hidden p-4 sm:p-5">
      <div className="mb-4">
        <p className="panel-kicker">Comparison</p>
        <h2 className="panel-title mt-1">Metrics Table</h2>
      </div>

      <div className="space-y-3 sm:hidden">
        {METRICS.map(({ key, label, higherBetter, format }) => {
          const bestConfig = getBestConfig(key, higherBetter)
          return (
            <div key={key} className="rounded-lg border border-neutral-800 bg-[#0b0b0b] p-3">
              <p className="mb-3 text-sm font-bold text-neutral-300">{label}</p>
              <div className="grid grid-cols-2 gap-2">
                {CONFIGS.map(config => {
                  const val = results[config]?.[key]
                  const isBest = config === bestConfig && val != null
                  return (
                    <div
                      key={config}
                      className={`rounded-md border px-2.5 py-2 ${
                        isBest
                          ? 'border-white bg-[#171717]'
                          : 'border-neutral-800 bg-black'
                      }`}
                    >
                      <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.04em] text-neutral-500">{config}</p>
                      <p className={`mt-1 font-mono text-sm font-extrabold ${
                        isBest ? 'text-white' : 'text-neutral-100'
                      }`}>
                        {val != null ? format(val) : '-'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-neutral-800 sm:block">
        <table className="metric-table w-full min-w-[680px] border-collapse text-sm">
          <thead className="bg-[#0b0b0b]">
            <tr>
              <th className="px-3 py-3 text-left">Metric</th>
              {CONFIGS.map(c => (
                <th key={c} className="px-3 py-3 text-right whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ key, label, higherBetter, format }) => {
              const bestConfig = getBestConfig(key, higherBetter)
              return (
                <tr key={key} className="bg-[#101010] transition-colors hover:bg-[#171717]">
                  <td className="px-3 py-3 font-medium text-neutral-400">{label}</td>
                  {CONFIGS.map(config => {
                    const val = results[config]?.[key]
                    const isBest = config === bestConfig && val != null
                    return (
                      <td
                        key={config}
                        className={`px-3 py-3 text-right font-mono text-[0.83rem] ${
                          isBest
                            ? 'bg-[#171717] font-extrabold text-white'
                            : 'text-neutral-100'
                        }`}
                      >
                        {val != null ? format(val) : '-'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
