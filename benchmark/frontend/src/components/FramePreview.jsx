import { useEffect, useState } from 'react'
import { Loader2, ImageOff } from 'lucide-react'
import { getPreview } from '../lib/api'

const CONFIGS = ['YOLOv8', 'RT-DETR', 'NMS Ensemble', 'WBF Ensemble']

export default function FramePreview({ jobId }) {
  const [previews, setPreviews] = useState({})
  const [loading, setLoading] = useState({})

  useEffect(() => {
    if (!jobId) return

    const initial = {}
    CONFIGS.forEach(c => { initial[c] = true })
    setLoading(initial)

    CONFIGS.forEach(async (config) => {
      try {
        const data = await getPreview(jobId, config)
        setPreviews(prev => ({ ...prev, [config]: data.image }))
      } catch (e) {
        setPreviews(prev => ({ ...prev, [config]: null }))
      } finally {
        setLoading(prev => ({ ...prev, [config]: false }))
      }
    })
  }, [jobId])

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4">
        <p className="panel-kicker">Preview</p>
        <h2 className="panel-title mt-1">Annotated Frames</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CONFIGS.map(config => (
          <div key={config} className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-bold text-neutral-400">{config}</p>
            </div>
            <div className="aspect-square overflow-hidden rounded-lg border border-neutral-800 bg-[#0b0b0b]">
              {loading[config] ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              ) : previews[config] ? (
                <img
                  src={previews[config]}
                  alt={`${config} preview`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <ImageOff className="h-6 w-6 text-neutral-600" />
                  <span className="text-xs font-medium text-neutral-600">No preview</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
