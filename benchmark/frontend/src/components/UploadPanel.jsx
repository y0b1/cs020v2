import { useRef, useState } from 'react'
import { Upload, CheckCircle2 } from 'lucide-react'

const ACCEPTED = '.mp4,.avi,.mov,.mkv,.jpg,.jpeg,.png'

export default function UploadPanel({ onUpload, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [fileInfo, setFileInfo] = useState(null)

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleFile(file) {
    if (!file) return
    setFileInfo({ name: file.name, size: formatBytes(file.size) })
    onUpload(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function onClick() {
    if (!disabled) inputRef.current?.click()
  }

  function onKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  function onChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="panel p-4">
      <div className="mb-3">
        <p className="panel-kicker">Input</p>
        <h2 className="panel-title mt-1">Source File</h2>
      </div>

      <div
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={`min-h-[184px] rounded-lg border border-dashed p-5 text-center transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-neutral-700 bg-[#0b0b0b] opacity-60'
            : dragging
            ? 'cursor-copy border-white bg-[#171717]'
            : fileInfo
            ? 'cursor-pointer border-white bg-[#171717] hover:border-neutral-300'
            : 'cursor-pointer border-neutral-700 bg-[#0b0b0b] hover:border-white hover:bg-[#171717]'
        }`}
      >
        <div className="flex h-full min-h-[140px] flex-col items-center justify-center">
          {fileInfo ? (
            <>
              <CheckCircle2 className="mb-3 h-9 w-9 text-white" />
              <p className="max-w-full truncate px-2 text-sm font-semibold text-neutral-100">{fileInfo.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{fileInfo.size}</p>
              {!disabled && (
                <p className="mt-3 text-xs font-medium text-neutral-400">Click to replace</p>
              )}
            </>
          ) : (
            <>
              <Upload className={`mb-3 h-9 w-9 ${dragging ? 'text-white' : 'text-neutral-500'}`} />
              <p className="text-sm font-semibold text-neutral-100">Drop video or image</p>
              <p className="mt-1 text-xs text-neutral-500">or click to browse</p>
              <p className="mt-4 text-xs text-neutral-600">mp4 / avi / mov / mkv / jpg / png</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
