import { Link } from 'react-router-dom'
import type { EventDto } from '../api/events'

interface Props {
  event: EventDto
  isRegistered?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function EventCard({ event, isRegistered = false }: Props) {
  const availableSpots = event.maxParticipants - event.registrationCount
  const isFull = availableSpots <= 0

  return (
    <Link to={`/events/${event.id}`} className="block">
      <div className={`bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-all ${isRegistered ? 'border-green-400 hover:border-green-500' : 'border-gray-200 hover:border-nje'}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900">{event.title}</h2>
          {isRegistered && (
            <span className="shrink-0 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              ✓ Regisztrálva
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-3">{event.location}{event.room ? ` — ${event.room}` : ''}</p>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">📅</span>
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🏁</span>
            <span>{formatDate(event.endDate)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
            {isFull ? 'Megtelt' : `${availableSpots} szabad hely`}
          </span>
          <span className="text-nje text-sm font-medium">Részletek →</span>
        </div>
      </div>
    </Link>
  )
}
