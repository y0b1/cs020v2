import { CheckCircle2, Loader2, Circle } from 'lucide-react'

const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']

function getConfigStatus(config, currentConfig, overallStatus) {
  if (overallStatus === 'done') return 'done'
  if (overallStatus !== 'running') return 'pending'
  const currentIdx = CONFIGS.indexOf(currentConfig)
  const configIdx = CONFIGS.indexOf(config)
  if (configIdx < currentIdx) return 'done'
  if (configIdx === currentIdx) return 'active'
  return 'pending'
}

export default function ProgressTracker({ currentConfig, progress, status }) {
  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="panel-kicker">Progress</p>
          <h2 className="panel-title mt-1">Configurations</h2>
        </div>
        <span className="text-sm font-bold text-neutral-300">{Math.round(progress)}%</span>
      </div>

      <div className="space-y-2">
        {CONFIGS.map(config => {
          const configStatus = getConfigStatus(config, currentConfig, status)
          const configIdx = CONFIGS.indexOf(config)

          let barWidth = '0%'
          if (configStatus === 'done') {
            barWidth = '100%'
          } else if (configStatus === 'active') {
            const withinConfig = ((progress - configIdx * 25) / 25) * 100
            barWidth = `${Math.max(0, Math.min(100, withinConfig))}%`
          }

          return (
            <div
              key={config}
              className={`rounded-lg border p-3 transition-colors ${
                configStatus === 'active'
                  ? 'border-white bg-[#171717]'
                  : 'border-neutral-800 bg-[#0b0b0b]'
              }`}
            >
              <div className="mb-2 flex items-center gap-3">
                {configStatus === 'done' && (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-white" />
                )}
                {configStatus === 'active' && (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-white" />
                )}
                {configStatus === 'pending' && (
                  <Circle className="h-4 w-4 flex-shrink-0 text-neutral-700" />
                )}

                <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${
                  configStatus === 'pending' ? 'text-neutral-500' : 'text-neutral-100'
                }`}>
                  {config}
                </span>
                <span className={`text-xs font-semibold ${
                  configStatus === 'pending' ? 'text-neutral-600' : 'text-white'
                }`}>
                  {configStatus === 'done' ? 'Done' : configStatus === 'active' ? 'Running' : 'Pending'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    configStatus === 'pending' ? 'bg-neutral-700' : 'bg-white'
                  }`}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
