import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getEvents } from '../api/events'
import type { EventDto } from '../api/events'
import { checkin } from '../api/registrations'
import QrScanner from '../components/QrScanner'

interface ScanResult {
  success: boolean
  message: string
  fullName?: string
}

export default function QrScannerPage() {
  const [searchParams] = useSearchParams()
  const preselectedEventId = searchParams.get('eventId') ? parseInt(searchParams.get('eventId')!) : null

  const [events, setEvents] = useState<EventDto[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(preselectedEventId)
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [resultTimer, setResultTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getEvents().then(res => {
      setEvents(res.data)
      // If no preselected event, default to first
      if (!preselectedEventId && res.data.length > 0) {
        setSelectedEventId(res.data[0].id)
        setSelectedEventTitle(res.data[0].title)
      } else if (preselectedEventId) {
        const found = res.data.find(e => e.id === preselectedEventId)
        if (found) setSelectedEventTitle(found.title)
      }
    })
  }, [preselectedEventId])

  const handleScan = useCallback(async (qrToken: string) => {
    if (!selectedEventId || result) return

    setScanning(false)

    try {
      const res = await checkin({ qrData: qrToken, eventId: selectedEventId })
      setResult({
        success: true,
        message: res.data.message,
        fullName: res.data.fullName
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string } }
      setResult({
        success: false,
        message: axiosErr.response?.data || 'Érvénytelen QR kód vagy nem regisztrált résztvevő.'
      })
    }

    const timer = setTimeout(() => {
      setResult(null)
      setScanning(true)
      setResultTimer(null)
    }, 3000)
    setResultTimer(timer)
  }, [selectedEventId, result])

  useEffect(() => {
    return () => {
      if (resultTimer) clearTimeout(resultTimer)
    }
  }, [resultTimer])

  const handleEventChange = (id: number) => {
    setSelectedEventId(id)
    const found = events.find(e => e.id === id)
    if (found) setSelectedEventTitle(found.title)
    setScanning(false)
    setResult(null)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-nje hover:underline text-sm">← Admin felület</Link>
        <h1 className="text-2xl font-bold text-nje">QR Beolvasó</h1>
      </div>

      {/* Selected event banner */}
      {selectedEventTitle && (
        <div className="bg-nje text-white rounded-lg px-4 py-3 mb-4 text-sm font-medium">
          📋 {selectedEventTitle}
        </div>
      )}

      {/* Event selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Esemény kiválasztása
        </label>
        <select
          value={selectedEventId ?? ''}
          onChange={e => handleEventChange(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* Start/stop scanning */}
      {!scanning && !result && (
        <button
          onClick={() => setScanning(true)}
          disabled={!selectedEventId}
          className="w-full bg-nje text-white py-3 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50 mb-6"
        >
          📷 Beolvasás indítása
        </button>
      )}

      {scanning && (
        <div className="mb-6">
          <QrScanner onScan={handleScan} active={scanning} />
          <button
            onClick={() => setScanning(false)}
            className="mt-4 w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Leállítás
          </button>
        </div>
      )}

      {/* Scan result */}
      {result && (
        <div className={`rounded-lg p-6 text-center border-2 ${
          result.success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
        }`}>
          <div className="text-5xl mb-3">{result.success ? '✅' : '❌'}</div>
          {result.fullName && (
            <p className="text-xl font-bold text-gray-900 mb-1">{result.fullName}</p>
          )}
          <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>
          <p className="text-xs text-gray-400 mt-3">Automatikus folytatás 3 másodperc múlva...</p>
        </div>
      )}
    </div>
  )
}
