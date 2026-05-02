import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getParticipants } from '../api/events'
import type { ParticipantDto } from '../api/events'
import { removeRegistration } from '../api/registrations'
import ParticipantTable from '../components/ParticipantTable'
import client from '../api/client'

interface RegistrationRecord {
  id: number
  userId: number
  eventId: number
  registrationDate: string
  isPresent: boolean
}

interface ParticipantWithId extends ParticipantDto {
  registrationId: number
}

export default function ParticipantListPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = parseInt(id ?? '0')

  const [participants, setParticipants] = useState<ParticipantWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadParticipants = async () => {
    setLoading(true)
    try {
      // Fetch participants (name, email, date, isPresent) and raw registrations (for IDs)
      const [participantsRes, regsRes] = await Promise.all([
        getParticipants(eventId),
        client.get<RegistrationRecord[]>('/registrations')
      ])

      const eventRegs = regsRes.data.filter(r => r.eventId === eventId)

      // Merge: match by registrationDate since we don't have userId in participant response
      const merged: ParticipantWithId[] = participantsRes.data.map((p, idx) => ({
        ...p,
        registrationId: eventRegs[idx]?.id ?? idx
      }))

      setParticipants(merged)
    } catch {
      setError('Nem sikerült betölteni a résztvevőket.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParticipants()
  }, [eventId])

  const handleRemove = async (registrationId: number) => {
    await removeRegistration(registrationId)
    await loadParticipants()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-nje hover:underline text-sm">
          ← Admin felület
        </Link>
        <h1 className="text-2xl font-bold text-nje">Résztvevők</h1>
      </div>

      {loading ? (
        <p className="text-gray-500">Betöltés...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{participants.length} regisztrált résztvevő</p>
          <ParticipantTable participants={participants} onRemove={handleRemove} />
        </>
      )}
    </div>
  )
}
