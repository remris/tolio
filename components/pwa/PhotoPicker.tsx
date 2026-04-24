'use client'

import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'

interface Props {
  photos: File[]
  previews: string[]
  max?: number
  onChange: (photos: File[], previews: string[]) => void
}

export default function PhotoPicker({ photos, previews, max = 3, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = max - photos.length
    const newFiles = files.slice(0, remaining)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    onChange([...photos, ...newFiles], [...previews, ...newPreviews])
    e.target.value = ''
  }

  function remove(i: number) {
    URL.revokeObjectURL(previews[i])
    onChange(photos.filter((_, idx) => idx !== i), previews.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        Fotos (optional, max. {max})
      </label>
      <div className="flex gap-2 flex-wrap">
        {previews.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="text-xs mt-0.5">Foto</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}

