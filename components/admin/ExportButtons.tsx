'use client'

export default function ExportButtons() {
  function download(type: string) {
    window.location.href = `/api/export?type=${type}`
  }

  return (
    <div className="relative group">
      <button className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1">
        ⬇ Export
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg py-1 min-w-[160px] hidden group-hover:block z-10">
        <button onClick={() => download('assets')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
          Assets (CSV)
        </button>
        <button onClick={() => download('logs')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
          Aktivitätslog (CSV)
        </button>
        <button onClick={() => download('maintenance')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
          Wartungshistorie (CSV)
        </button>
      </div>
    </div>
  )
}

