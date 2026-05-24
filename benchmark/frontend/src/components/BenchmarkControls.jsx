import { Play, FlaskConical, Loader2 } from 'lucide-react'

export default function BenchmarkControls({ jobId, status, onRun, onLoadSample }) {
  const isRunning = status === 'running'
  const isUploading = status === 'uploading'
  const isBusy = isRunning || isUploading
  const canRun = !!jobId && !isBusy

  return (
    <div className="panel p-4">
      <div className="mb-4">
        <p className="panel-kicker">Actions</p>
        <h2 className="panel-title mt-1">Benchmark Controls</h2>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRun}
          disabled={!canRun}
          className="btn btn-primary w-full"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? 'Benchmark Running...' : 'Run Benchmark'}
        </button>

        <button
          onClick={onLoadSample}
          disabled={isBusy}
          className="btn btn-secondary w-full"
        >
          <FlaskConical className="h-4 w-4" />
          Load Sample Data
        </button>

        <div className="rounded-lg border border-neutral-800 bg-[#0b0b0b] px-3 py-2 text-center text-xs text-neutral-500">
          {!jobId && !isUploading && 'Upload a file first to enable benchmark'}
          {isUploading && 'Upload in progress'}
          {jobId && !isBusy && 'Runs 4 configurations sequentially'}
          {isRunning && 'Processing each configuration'}
        </div>
      </div>
    </div>
  )
}
