import { useState, type FormEvent } from 'react'
import type { EventDto, EventCreateDto } from '../api/events'

interface Props {
  initial?: EventDto
  onSubmit: (dto: EventCreateDto) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function EventForm({ initial, onSubmit, onCancel, loading }: Props) {
  const toInputDate = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : ''

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [room, setRoom] = useState(initial?.room ?? '')
  const [startDate, setStartDate] = useState(toInputDate(initial?.startDate))
  const [endDate, setEndDate] = useState(toInputDate(initial?.endDate))
  const [maxParticipants, setMaxParticipants] = useState(initial?.maxParticipants ?? 100)
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Az esemény neve kötelező!')
      return
    }
    if (!startDate || !endDate) {
      setError('A dátumok megadása kötelező!')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('A befejezés dátumának a kezdés dátuma után kell lennie!')
      return
    }

    try {
      await onSubmit({
        title,
        description,
        location,
        room: room || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxParticipants,
        isPublished
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string } }
      setError(axiosErr.response?.data || 'Hiba történt a mentés során.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Esemény neve <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Helyszín</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
            placeholder="GAMF Aula"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terem</label>
          <input
            type="text"
            value={room}
            onChange={e => setRoom(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
            placeholder="A101"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kezdés dátuma <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Befejezés dátuma <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max. résztvevők</label>
        <input
          type="number"
          value={maxParticipants}
          onChange={e => setMaxParticipants(parseInt(e.target.value))}
          min={1}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={isPublished}
          onChange={e => setIsPublished(e.target.checked)}
          className="h-4 w-4 text-nje"
        />
        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
          Közzétéve (látható a felhasználóknak)
        </label>
      </div>
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-nje text-white px-5 py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Mentés...' : 'Mentés'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-50 transition-colors"
        >
          Mégse
        </button>
      </div>
    </form>
  )
}
