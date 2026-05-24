import { Radio } from 'lucide-react'

const MODELS = [
  { id: 'yolov8', label: 'YOLOv8' },
  { id: 'rtdetr', label: 'RT-DETR' },
]

export default function LiveFeed({ jobId }) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="panel-kicker">Video</p>
          <div className="mt-1 flex items-center gap-2">
            <Radio className="h-4 w-4 flex-shrink-0 text-white" />
            <h2 className="panel-title">Detection Playback</h2>
          </div>
        </div>
        <span className="rounded-full border border-neutral-500 bg-[#171717] px-2 py-1 text-[0.68rem] font-extrabold text-white">
          VIDEO
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MODELS.map(({ id, label }) => (
          <div key={id} className="min-w-0">
            <p className="mb-2 text-xs font-bold text-neutral-400">{label}</p>
            <div className="aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-[#0b0b0b]">
              <img
                src={`/api/stream/${jobId}?model=${id}`}
                alt={`${label} detection playback`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
