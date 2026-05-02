import { useEffect, useState } from 'react'
import { getEvents } from '../api/events'
import type { EventDto } from '../api/events'
import EventCard from '../components/EventCard'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

interface RegistrationRecord {
  id: number
  userId: number
  eventId: number
}

export default function EventListPage() {
  const { userId } = useAuth()
  const [events, setEvents] = useState<EventDto[]>([])
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const requests: [Promise<{ data: EventDto[] }>, Promise<{ data: RegistrationRecord[] }> | null] = [
      getEvents(),
      userId ? client.get<RegistrationRecord[]>('/registrations') : null
    ]

    Promise.all(requests)
      .then(([eventsRes, regsRes]) => {
        setEvents(eventsRes.data)
        if (regsRes && userId) {
          const myEventIds = new Set(
            regsRes.data
              .filter(r => r.userId === userId)
              .map(r => r.eventId)
          )
          setRegisteredEventIds(myEventIds)
        }
      })
      .catch(() => setError('Nem sikerült betölteni az eseményeket.'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500 text-center">Betöltés...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-nje mb-6">Események</h1>
      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">{error}</p>
      )}
      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Jelenleg nincsenek elérhető események.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={registeredEventIds.has(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
