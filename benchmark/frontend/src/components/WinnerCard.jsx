import { Trophy, Zap, BarChart2, Target } from 'lucide-react'

const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']

export default function WinnerCard({ results }) {
  const bestAccuracy = CONFIGS.reduce((best, c) =>
    (results[c]?.mAP50 ?? 0) > (results[best]?.mAP50 ?? 0) ? c : best
  )
  const bestSpeed = CONFIGS.reduce((best, c) =>
    (results[c]?.fps ?? 0) > (results[best]?.fps ?? 0) ? c : best
  )

  const maxMAP = Math.max(...CONFIGS.map(c => results[c]?.mAP50 ?? 0)) || 1
  const maxFPS = Math.max(...CONFIGS.map(c => results[c]?.fps ?? 0)) || 1
  const bestTradeoff = CONFIGS.reduce((best, c) => {
    const scoreC = 0.6 * ((results[c]?.mAP50 ?? 0) / maxMAP) + 0.4 * ((results[c]?.fps ?? 0) / maxFPS)
    const scoreBest = 0.6 * ((results[best]?.mAP50 ?? 0) / maxMAP) + 0.4 * ((results[best]?.fps ?? 0) / maxFPS)
    return scoreC > scoreBest ? c : best
  })

  const cards = [
    {
      label: 'Best Accuracy',
      winner: bestAccuracy,
      icon: Target,
      stat: `${((results[bestAccuracy]?.mAP50 ?? 0) * 100).toFixed(1)}% mAP@0.5`,
    },
    {
      label: 'Best Speed',
      winner: bestSpeed,
      icon: Zap,
      stat: `${(results[bestSpeed]?.fps ?? 0).toFixed(1)} FPS`,
    },
    {
      label: 'Best Trade-off',
      winner: bestTradeoff,
      icon: BarChart2,
      stat: 'Balanced score',
    },
  ]

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-white" />
        <div>
          <p className="panel-kicker">Winners</p>
          <h2 className="panel-title mt-1">Top Performing Configurations</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map(({ label, winner, icon: Icon, stat }) => (
          <div
            key={label}
            className="panel-flat p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="rounded-lg border border-neutral-700 bg-[#0b0b0b] p-2">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-right text-[0.68rem] font-bold uppercase tracking-[0.11em] text-neutral-500">{label}</span>
            </div>
            <p className="truncate text-lg font-extrabold text-white">{winner}</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">{stat}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
