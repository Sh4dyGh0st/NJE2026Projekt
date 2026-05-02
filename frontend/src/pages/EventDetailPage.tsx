import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEvent } from '../api/events'
import type { EventDto } from '../api/events'
import { getModules } from '../api/modules'
import type { EventModule } from '../api/modules'
import { joinEvent, leaveEvent } from '../api/registrations'
import { useAuth } from '../context/AuthContext'
import ModuleSection from '../components/ModuleSection'
import client from '../api/client'

interface RegistrationRecord {
  id: number
  userId: number
  eventId: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { userId } = useAuth()

  const [event, setEvent] = useState<EventDto | null>(null)
  const [modules, setModules] = useState<EventModule[]>([])
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [unregistering, setUnregistering] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)
  const [error, setError] = useState('')
  const [regError, setRegError] = useState('')

  useEffect(() => {
    if (!id) return
    const eventId = parseInt(id)

    const requests: Promise<unknown>[] = [
      getEvent(eventId),
      getModules(eventId)
    ]

    // Also check if user is already registered
    if (userId) {
      requests.push(client.get<RegistrationRecord[]>('/registrations'))
    }

    Promise.all(requests)
      .then(([evRes, modRes, regsRes]) => {
        const ev = (evRes as { data: EventDto }).data
        setEvent(ev)
        setModules((modRes as { data: EventModule[] }).data)

        if (userId && regsRes) {
          const allRegs = (regsRes as { data: RegistrationRecord[] }).data
          const alreadyRegistered = allRegs.some(
            r => r.userId === userId && r.eventId === eventId
          )
          setIsRegistered(alreadyRegistered)
        }
      })
      .catch(() => setError('Nem sikerült betölteni az eseményt.'))
      .finally(() => setLoading(false))
  }, [id, userId])

  // Auto-dismiss the success banner after 5 seconds
  useEffect(() => {
    if (!regSuccess) return
    const timer = setTimeout(() => setRegSuccess(false), 5000)
    return () => clearTimeout(timer)
  }, [regSuccess])

  const handleRegister = async () => {
    if (!userId || !event) return
    setRegError('')
    setRegistering(true)
    try {
      await joinEvent({ userId, eventId: event.id })
      setIsRegistered(true)
      setRegSuccess(true)
      // Refresh event to update registration count
      const refreshed = await getEvent(event.id)
      setEvent(refreshed.data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string; status?: number } }
      if (axiosErr.response?.status === 409) {
        setIsRegistered(true)
        setRegError('Már regisztráltál erre az eseményre.')
      } else {
        setRegError(axiosErr.response?.data || 'Regisztrációs hiba történt.')
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!event) return
    setRegError('')
    setUnregistering(true)
    try {
      await leaveEvent(event.id)
      setIsRegistered(false)
      setRegSuccess(false)
      // Refresh event to update registration count
      const refreshed = await getEvent(event.id)
      setEvent(refreshed.data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string } }
      setRegError(axiosErr.response?.data || 'Leiratkozási hiba történt.')
    } finally {
      setUnregistering(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-500">Betöltés...</div>
  if (error || !event) return <div className="max-w-3xl mx-auto px-4 py-8 text-red-600">{error || 'Az esemény nem található.'}</div>

  const registrationCount = event.registrationCount
  const availableSpots = event.maxParticipants - registrationCount
  const isFull = availableSpots <= 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-nje transition-colors mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Vissza az eseményekhez
      </Link>
      <h1 className="text-3xl font-bold text-nje mb-2">{event.title}</h1>
      <p className="text-gray-500 mb-6">{event.location}{event.room ? ` — ${event.room}` : ''}</p>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 space-y-3">
        <div className="flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">Kezdés:</span>{' '}
            {formatDate(event.startDate)}
          </div>
          <div>
            <span className="font-medium text-gray-700">Befejezés:</span>{' '}
            {formatDate(event.endDate)}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Szabad helyek:</span>{' '}
          <span className={isFull ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {isFull ? 'Megtelt' : `${availableSpots} / ${event.maxParticipants}`}
          </span>
        </div>
        {event.description && (
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        )}
      </div>

      {/* Registration section */}
      <div className="mb-6">
        {regError && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">{regError}</p>
        )}

        {/* Success badge after registering */}
        {regSuccess && isRegistered && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-lg px-4 py-3 mb-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Sikeresen regisztráltál!</p>
              <p className="text-sm text-green-600">
                A QR kódodat a{' '}
                <a href="/qr" className="underline font-medium">QR kódom</a>
                {' '}oldalon találod.
              </p>
            </div>
          </div>
        )}

        {isRegistered ? (
          <div className="flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-full">
              <span>✓</span> Regisztrálva
            </span>
            <a
              href="/qr"
              className="bg-nje text-white px-4 py-2 rounded font-medium hover:bg-nje-light transition-colors text-sm"
            >
              QR-kódom megtekintése
            </a>
            <button
              onClick={handleUnregister}
              disabled={unregistering}
              className="border border-red-300 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
            >
              {unregistering ? 'Leiratkozás...' : 'Leiratkozás az eseményről'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleRegister}
            disabled={registering || isFull}
            className="bg-nje text-white px-6 py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
          >
            {registering ? 'Regisztráció...' : isFull ? 'Megtelt' : 'Regisztrálok az eseményre'}
          </button>
        )}
      </div>

      {/* Modules */}
      {modules.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Információk</h2>
          {modules.map(mod => (
            <ModuleSection key={mod.id} module={mod} />
          ))}
        </div>
      )}
    </div>
  )
}
