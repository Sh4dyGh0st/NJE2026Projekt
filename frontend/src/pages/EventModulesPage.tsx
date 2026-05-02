import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getEvent } from '../api/events'
import { getModules, createModule, updateModule, deleteModule } from '../api/modules'
import type { EventModule, EventModuleCreateDto } from '../api/modules'
import ConfirmDialog from '../components/ConfirmDialog'
import ModuleSection from '../components/ModuleSection'

const MODULE_TYPES = [
  { value: 'InformationPage', label: 'ℹ️ Információs oldal' },
  { value: 'Map', label: '📍 Térkép / Helyszín' },
  { value: 'UsefulInformation', label: '💡 Hasznos információk' },
]

const EMPTY_FORM: EventModuleCreateDto = {
  moduleType: 'InformationPage',
  title: '',
  content: '',
  sortOrder: 0,
}

export default function EventModulesPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = parseInt(id ?? '0')

  const [eventTitle, setEventTitle] = useState('')
  const [modules, setModules] = useState<EventModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState<EventModuleCreateDto>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<EventModule | null>(null)

  const loadData = async () => {
    try {
      const [evRes, modRes] = await Promise.all([
        getEvent(eventId),
        getModules(eventId)
      ])
      setEventTitle(evRes.data.title)
      setModules(modRes.data)
    } catch {
      setError('Nem sikerült betölteni a modulokat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [eventId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    if (!form.title.trim()) { setFormError('A cím megadása kötelező!'); return }
    if (!form.content.trim()) { setFormError('A tartalom megadása kötelező!'); return }

    setSaving(true)
    try {
      if (editingId !== null) {
        await updateModule(eventId, editingId, form)
        setFormSuccess('Modul sikeresen frissítve!')
      } else {
        await createModule(eventId, form)
        setFormSuccess('Modul sikeresen létrehozva!')
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
      await loadData()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string } }
      setFormError(axiosErr.response?.data || 'Hiba történt a mentés során.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (mod: EventModule) => {
    setEditingId(mod.id)
    setForm({ moduleType: mod.moduleType, title: mod.title, content: mod.content, sortOrder: mod.sortOrder })
    setFormSuccess('')
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteModule(eventId, deleteTarget.id)
      setDeleteTarget(null)
      await loadData()
    } catch {
      setFormError('Nem sikerült törölni a modult.')
      setDeleteTarget(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormSuccess('')
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-500">Betöltés...</div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-8 text-red-600">{error}</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/admin" className="text-nje hover:underline text-sm">← Admin felület</Link>
      </div>
      <h1 className="text-2xl font-bold text-nje mb-1">Modulok kezelése</h1>
      <p className="text-gray-500 text-sm mb-6">{eventTitle}</p>

      {/* Add / Edit form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingId !== null ? 'Modul szerkesztése' : 'Új modul hozzáadása'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modul típusa</label>
            <select
              value={form.moduleType}
              onChange={e => setForm(f => ({ ...f, moduleType: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
            >
              {MODULE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cím <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder={form.moduleType === 'Map' ? 'pl. Helyszín' : 'pl. Fontos tudnivalók'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.moduleType === 'Map' ? 'Cím / Helyszín neve' : 'Tartalom'}{' '}
              <span className="text-red-500">*</span>
            </label>
            {form.moduleType === 'Map' ? (
              <>
                <input
                  type="text"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
                  placeholder="pl. Kecskemét, Izsáki út 10. vagy https://maps.google.com/..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Megadható pontos cím (pl. "Kecskemét, GAMF Aula") vagy Google Maps link.
                  A térkép automatikusan beágyazódik az esemény oldalán.
                </p>
              </>
            ) : (
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
                placeholder="Ide írd a tartalmat..."
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sorrend</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
              min={0}
              className="w-32 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
            />
            <p className="text-xs text-gray-400 mt-1">Kisebb szám = előrébb jelenik meg</p>
          </div>

          {formError && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>}
          {formSuccess && <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">{formSuccess}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-nje text-white px-5 py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Mentés...' : editingId !== null ? 'Frissítés' : 'Modul hozzáadása'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className="border border-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                Mégse
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing modules */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Meglévő modulok ({modules.length})
      </h2>

      {modules.length === 0 ? (
        <p className="text-gray-500 text-center py-8 bg-white rounded-lg border border-gray-200">
          Még nincsenek modulok ehhez az eseményhez.
        </p>
      ) : (
        <div>
          {modules.map(mod => (
            <div key={mod.id}>
              <ModuleSection module={mod} />
              <div className="flex gap-3 mb-4 -mt-2 px-1">
                <button onClick={() => handleEdit(mod)} className="text-xs text-nje hover:underline">
                  Szerkesztés
                </button>
                <button onClick={() => setDeleteTarget(mod)} className="text-xs text-red-600 hover:underline">
                  Törlés
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Modul törlése"
          message={`Biztosan törölni szeretnéd a(z) "${deleteTarget.title}" modult?`}
          confirmText="Törlés"
          cancelText="Mégse"
          danger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
