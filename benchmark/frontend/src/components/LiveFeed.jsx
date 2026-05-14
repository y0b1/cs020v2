import { Radio } from 'lucide-react'

const MODELS = [
  { id: 'yolov8', label: 'YOLOv8' },
  { id: 'rtdetr', label: 'RT-DETR' },
]

export default function LiveFeed({ jobId }) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4" style={{ color: '#22c55e' }} />
        <h2 className="text-[#f4f4f5] font-semibold text-lg">Live Detection</h2>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: '#14532d', color: '#22c55e', letterSpacing: '0.05em' }}
        >
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MODELS.map(({ id, label }) => (
          <div key={id} className="flex flex-col gap-2">
            <p className="text-[#71717a] text-xs font-medium text-center">{label}</p>
            <div
              className="rounded-lg overflow-hidden border border-[#222222] bg-[#0a0a0a]"
              style={{ aspectRatio: '1 / 1' }}
            >
              <img
                src={`/api/stream/${jobId}?model=${id}`}
                alt={`${label} live feed`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
