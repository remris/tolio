'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Pencil, X, Save, Plus, Trash2, MapPin } from 'lucide-react'

interface Props {
  companyId: string
  initialName: string
  initialCode: string
}

interface Location { id: string; name: string }

export default function SettingsForm({ companyId, initialName, initialCode }: Props) {
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState(initialCode)
  const [editName, setEditName] = useState(false)
  const [editCode, setEditCode] = useState(false)
  const [tempName, setTempName] = useState(initialName)
  const [tempCode, setTempCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [locations, setLocations] = useState<Location[]>([])
  const [newLocation, setNewLocation] = useState('')
  const [locSaving, setLocSaving] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/locations').then(r => r.ok ? r.json() : []).then(setLocations)
  }, [])

  async function save(patch: { name?: string; code?: string }) {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Fehler beim Speichern.')
      return false
    }
    setSuccess('Gespeichert.')
    setTimeout(() => setSuccess(null), 3000)
    return true
  }

  async function saveName() {
    const ok = await save({ name: tempName })
    if (ok) { setName(tempName); setEditName(false) }
  }

  async function saveCode() {
    const ok = await save({ code: tempCode })
    if (ok) { setCode(tempCode); setEditCode(false) }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function addLocation() {
    if (!newLocation.trim()) return
    setLocSaving(true)
    setLocError(null)
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLocation.trim() }),
    })
    const data = await res.json()
    setLocSaving(false)
    if (!res.ok) { setLocError(data.error ?? 'Fehler.'); return }
    setLocations(prev => [...prev, data])
    setNewLocation('')
  }

  async function deleteLocation(id: string) {
    if (!confirm('Lagerort wirklich löschen?')) return
    await fetch(`/api/locations/${id}`, { method: 'DELETE' })
    setLocations(prev => prev.filter(l => l.id !== id))
  }

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full'

  return (
    <div className="space-y-6 max-w-xl">
      {/* Firmenname */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Firmenname</p>
        {editName ? (
          <div className="flex items-center gap-2">
            <input value={tempName} onChange={e => setTempName(e.target.value)} className={inputCls} />
            <button onClick={saveName} disabled={saving} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditName(false); setTempName(name) }} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">{name}</span>
            <button onClick={() => { setEditName(true); setTempName(name) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Firmencode */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Firmencode</p>
        <p className="text-xs text-gray-400 mb-3">Mitarbeiter nutzen diesen Code beim Registrieren.</p>
        {editCode ? (
          <div className="flex items-center gap-2">
            <input
              value={tempCode}
              onChange={e => setTempCode(e.target.value)}
              className={inputCls}
              placeholder="z.B. meinefirma"
            />
            <button onClick={saveCode} disabled={saving} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditCode(false); setTempCode(code) }} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{code}</span>
              <button onClick={copyCode} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="Kopieren">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => { setEditCode(true); setTempCode(code) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2">{success}</p>}

      {/* Lagerorte */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lagerorte</p>
        </div>
        <p className="text-xs text-gray-400 mb-4">Definiere Lagerorte, die beim Anlegen von Assets ausgewählt werden können.</p>

        <div className="space-y-2 mb-4">
          {locations.length === 0 && (
            <p className="text-sm text-gray-400 py-2">Noch keine Lagerorte definiert.</p>
          )}
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-800">{loc.name}</span>
              <button
                onClick={() => deleteLocation(loc.id)}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation())}
            placeholder="Neuer Lagerort..."
            className={inputCls}
          />
          <button
            onClick={addLocation}
            disabled={locSaving || !newLocation.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {locError && <p className="text-xs text-red-500 mt-2">{locError}</p>}
      </div>

      {/* Infos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weitere Infos</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Firmen-ID</span>
          <span className="font-mono text-xs text-gray-400">{companyId}</span>
        </div>
      </div>
    </div>
  )
}

