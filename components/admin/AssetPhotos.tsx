'use client'
interface Props {
  photos: string[]
}

export default function AssetPhotos({ photos }: Props) {
  if (!photos.length) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-gray-100 block bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Foto ${i + 1}`}
            className="object-cover w-full h-full"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </a>
      ))}
    </div>
  )
}
