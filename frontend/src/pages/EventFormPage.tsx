import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEvent, createEvent, updateEvent } from '../api/events'
import type { EventDto, EventCreateDto } from '../api/events'
import EventForm from '../components/EventForm'

export default function EventFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [existing, setExisting] = useState<EventDto | undefined>(undefined)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getEvent(parseInt(id))
      .then(res => setExisting(res.data))
      .catch(() => setError('Nem sikerült betölteni az eseményt.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (dto: EventCreateDto) => {
    setSaving(true)
    try {
      if (isEdit && id) {
        await updateEvent(parseInt(id), dto)
      } else {
        await createEvent(dto)
      }
      navigate('/admin')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Betöltés...</div>
  if (error) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-600">{error}</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-nje mb-6">
        {isEdit ? 'Esemény szerkesztése' : 'Új esemény létrehozása'}
      </h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <EventForm
          initial={existing}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin')}
          loading={saving}
        />
      </div>
    </div>
  )
}
