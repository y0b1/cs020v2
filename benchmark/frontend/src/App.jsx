import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Download, X } from 'lucide-react'

import UploadPanel from './components/UploadPanel'
import BenchmarkControls from './components/BenchmarkControls'
import ProgressTracker from './components/ProgressTracker'
import MetricsTable from './components/MetricsTable'
import BarChart from './components/BarChart'
import TradeOffChart from './components/TradeOffChart'
import WinnerCard from './components/WinnerCard'
import FramePreview from './components/FramePreview'
import LiveFeed from './components/LiveFeed'

import logoUrl from './assets/Logo.png'
import welcomeImageUrl from './assets/WELCM_IMG.png'
import { uploadFile, startBenchmark, getStatus, getResults, getSample, exportResults } from './lib/api'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isWelcomeClosing, setIsWelcomeClosing] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [currentConfig, setCurrentConfig] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status !== 'running' || !jobId) return

    const id = setInterval(async () => {
      try {
        const s = await getStatus(jobId)
        setProgress(s.progress ?? 0)
        setCurrentConfig(s.current_config ?? '')

        if (s.status === 'done') {
          clearInterval(id)
          setStatus('done')
          const r = await getResults(jobId)
          setResults(r)
        } else if (s.status === 'error') {
          clearInterval(id)
          setStatus('error')
          setError(s.error || 'Benchmark failed')
        }
      } catch (err) {
        // Network errors during polling can be transient.
        console.warn('Poll error:', err.message)
      }
    }, 1500)

    return () => clearInterval(id)
  }, [status, jobId])

  const handleUpload = useCallback(async (file) => {
    setError(null)
    setStatus('uploading')
    const videoExts = ['mp4', 'avi', 'mov', 'mkv']
    const ext = file.name.split('.').pop().toLowerCase()
    setIsVideo(file.type.startsWith('video/') || videoExts.includes(ext))
    try {
      const { job_id } = await uploadFile(file)
      setJobId(job_id)
      setStatus('idle')
      setResults(null)
      setProgress(0)
      setCurrentConfig('')
    } catch (err) {
      setStatus('error')
      setError(`Upload failed: ${err.message}`)
    }
  }, [])

  const handleRun = useCallback(async () => {
    if (!jobId) return
    setError(null)
    setResults(null)
    setProgress(0)
    setCurrentConfig('YOLOv8')
    setStatus('running')
    try {
      await startBenchmark(jobId)
    } catch (err) {
      setStatus('error')
      setError(`Failed to start benchmark: ${err.message}`)
    }
  }, [jobId])

  const handleLoadSample = useCallback(async () => {
    setError(null)
    try {
      const sample = await getSample()
      setResults(sample)
      setStatus('done')
      setProgress(100)
    } catch (err) {
      setError(`Failed to load sample: ${err.message}`)
    }
  }, [])

  const handleCloseWelcome = useCallback(() => {
    setIsWelcomeClosing(true)
    window.setTimeout(() => {
      setShowWelcome(false)
      setIsWelcomeClosing(false)
    }, 170)
  }, [])

  return (
    <div className="app-shell">
      {showWelcome && (
        <div
          className="welcome-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md"
          data-state={isWelcomeClosing ? 'closing' : 'open'}
        >
          <div className="welcome-dialog relative max-h-[92vh] w-full max-w-[560px] overflow-hidden rounded-lg border border-neutral-700 bg-[#101010]">
            <button
              onClick={handleCloseWelcome}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 bg-black text-neutral-300 transition-colors hover:border-white hover:text-white"
              aria-label="Close welcome dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex justify-center border-b border-neutral-800 bg-black px-8 py-8">
              <img
                src={welcomeImageUrl}
                alt="Vehicle Detection Benchmark"
                className="max-h-44 w-full object-contain"
              />
            </div>

            <div className="max-h-[58vh] overflow-y-auto px-6 py-6 sm:px-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Vehicle Detection Benchmark</h2>

              <div className="mt-6 space-y-5 text-sm leading-6">
                <section>
                  <h3 className="font-bold text-white">No models needed</h3>
                  <p className="mt-1 text-neutral-400">
                    Click Load Sample Data to instantly preview the full dashboard with simulated benchmark results.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-white">Live detection feed</h3>
                  <p className="mt-1 text-neutral-400">
                    Upload a video to compare YOLOv8 and RT-DETR side-by-side with real-time vehicle detection overlays.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-white">Automated benchmarking</h3>
                  <p className="mt-1 text-neutral-400">
                    Run performance tests across multiple configurations with live progress tracking and automatic result rendering.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-white">Export analytics</h3>
                  <p className="mt-1 text-neutral-400">
                    Download benchmark metrics and detection results as CSV files for deeper analysis and reporting.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="topbar">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoUrl}
              alt="CS-020 logo"
              className="h-7 w-7 flex-shrink-0 object-contain"
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">CS-020</span>
                <span className="hidden text-sm font-medium text-neutral-400 sm:inline">Vehicle Detection Benchmark</span>
              </div>
              <p className="truncate text-xs text-neutral-500 sm:hidden">Vehicle Detection Benchmark</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-neutral-300 bg-black px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 xl:sticky xl:top-[84px] xl:self-start">
            <UploadPanel
              onUpload={handleUpload}
              disabled={status === 'running' || status === 'uploading'}
            />
            <BenchmarkControls
              jobId={jobId}
              status={status}
              onRun={handleRun}
              onLoadSample={handleLoadSample}
            />
            {(status === 'running' || status === 'done') && (
              <ProgressTracker
                currentConfig={currentConfig}
                progress={progress}
                status={status}
              />
            )}
          </aside>

          <section className="flex min-w-0 flex-col gap-5">
            {jobId && isVideo && <LiveFeed jobId={jobId} />}

            {!results && status !== 'running' && status !== 'uploading' && (!jobId || !isVideo) && (
              <div className="panel flex min-h-[380px] items-center justify-center border-dashed p-8 text-center sm:p-14">
                <div className="mx-auto max-w-md">
                  <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="CS-020 logo"
                      className="h-10 w-10 flex-shrink-0 object-contain"
                    />
                  </div>
                  <p className="font-semibold text-neutral-200">No results yet</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Upload a file and run the benchmark, or load sample data to preview the dashboard.
                  </p>
                </div>
              </div>
            )}

            {status === 'uploading' && !results && (
              <div className="panel flex min-h-[320px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
                  <p className="font-semibold text-neutral-100">Uploading file...</p>
                  <p className="mt-1 text-sm text-neutral-500">Preparing the benchmark job.</p>
                </div>
              </div>
            )}

            {status === 'running' && !results && !isVideo && (
              <div className="panel flex min-h-[360px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-neutral-800 border-t-white" />
                  <p className="font-semibold text-neutral-100">Running benchmark...</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {currentConfig ? `Currently: ${currentConfig}` : 'Initialising...'} ({progress}%)
                  </p>
                </div>
              </div>
            )}

            {results && (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="panel-kicker">Results</p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Benchmark Summary</h1>
                  </div>
                  {jobId && (
                    <button
                      onClick={() => exportResults(jobId)}
                      className="btn btn-secondary w-full sm:w-auto"
                      title="Download results as CSV"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </button>
                  )}
                </div>

                <WinnerCard results={results} />

                <MetricsTable results={results} />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <BarChart results={results} />
                  <TradeOffChart results={results} />
                </div>

                {jobId && (
                  <FramePreview jobId={jobId} results={results} />
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
