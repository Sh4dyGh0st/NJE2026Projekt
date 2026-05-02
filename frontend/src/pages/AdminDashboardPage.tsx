import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { getEvents, deleteEvent } from '../api/events'
import type { EventDto } from '../api/events'
import { createNews } from '../api/news'
import ConfirmDialog from '../components/ConfirmDialog'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export default function AdminDashboardPage() {
  // Events section
  const [events, setEvents] = useState<EventDto[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<EventDto | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // News section
  const [newsTitle, setNewsTitle] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [newsCategory, setNewsCategory] = useState('')
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsSuccess, setNewsSuccess] = useState('')
  const [newsError, setNewsError] = useState('')

  // Active tab
  const [tab, setTab] = useState<'events' | 'news'>('events')

  // Row action dropdown
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (openMenuId === id) {
      setOpenMenuId(null)
      setMenuPos(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    })
    setOpenMenuId(id)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
        setMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = () => {
    setEventsLoading(true)
    getEvents()
      .then(res => setEvents(res.data))
      .finally(() => setEventsLoading(false))
  }

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteEvent(deleteTarget.id)
      setDeleteTarget(null)
      loadEvents()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string; status?: number } }
      if (axiosErr.response?.status === 409) {
        setDeleteError('Az esemény nem törölhető, mert vannak regisztrált résztvevők!')
      } else {
        setDeleteError(axiosErr.response?.data || 'Hiba történt a törlés során.')
      }
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewsError('')
    setNewsSuccess('')
    if (!newsTitle.trim() || !newsContent.trim() || !newsCategory.trim()) {
      setNewsError('Minden mező kitöltése kötelező!')
      return
    }
    setNewsLoading(true)
    try {
      await createNews({ title: newsTitle, content: newsContent, category: newsCategory })
      setNewsTitle('')
      setNewsContent('')
      setNewsCategory('')
      setNewsSuccess('Hír sikeresen létrehozva!')
    } catch {
      setNewsError('Nem sikerült létrehozni a hírt.')
    } finally {
      setNewsLoading(false)
    }
  }


  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-nje mb-6">Admin felület</h1>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('events')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'events'
              ? 'border-nje text-nje'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Események
        </button>
        <button
          onClick={() => setTab('news')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            tab === 'news'
              ? 'border-nje text-nje'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Hírek
        </button>
      </div>

      {/* Events tab */}
      {tab === 'events' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Események kezelése</h2>
            <Link
              to="/admin/events/new"
              className="bg-nje text-white px-4 py-2 rounded font-medium hover:bg-nje-light transition-colors text-sm"
            >
              + Új esemény
            </Link>
          </div>

          {deleteError && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4 text-sm">
              {deleteError}
            </p>
          )}

          {eventsLoading ? (
            <p className="text-gray-500">Betöltés...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">Nincsenek események.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Esemény neve</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Helyszín</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Kezdés</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Résztvevők</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Közzétéve</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{ev.title}</td>
                      <td className="px-4 py-3 text-gray-600">{ev.location}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(ev.startDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${ev.registrationCount >= ev.maxParticipants ? 'text-red-600' : 'text-gray-700'}`}>
                          {ev.registrationCount} / {ev.maxParticipants}
                        </span>
                        {ev.registrationCount >= ev.maxParticipants && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Megtelt</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ev.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ev.isPublished ? 'Igen' : 'Nem'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {/* Primary action — always visible */}
                          <Link
                            to={`/admin/events/${ev.id}/edit`}
                            className="text-xs text-nje hover:underline font-medium"
                          >
                            Szerkesztés
                          </Link>

                          {/* More actions trigger */}
                          <button
                            onClick={(e) => handleMenuOpen(e, ev.id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label="További műveletek"
                            aria-expanded={openMenuId === ev.id}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>

                        {/* Dropdown rendered via portal so it escapes overflow:hidden */}
                        {openMenuId === ev.id && menuPos && createPortal(
                          <div
                            ref={menuRef}
                            style={{ position: 'absolute', top: menuPos.top, right: menuPos.right }}
                            className="z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                          >
                            <Link
                              to={`/admin/scanner?eventId=${ev.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-gray-50"
                              onClick={() => { setOpenMenuId(null); setMenuPos(null) }}
                            >
                              QR Beolvasás
                            </Link>
                            <Link
                              to={`/admin/events/${ev.id}/participants`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                              onClick={() => { setOpenMenuId(null); setMenuPos(null) }}
                            >
                              Résztvevők
                            </Link>
                            <Link
                              to={`/admin/events/${ev.id}/modules`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-gray-50"
                              onClick={() => { setOpenMenuId(null); setMenuPos(null) }}
                            >
                              Modulok
                            </Link>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => { setOpenMenuId(null); setMenuPos(null); setDeleteError(''); setDeleteTarget(ev) }}
                              disabled={deleting}
                              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Törlés
                            </button>
                          </div>,
                          document.body
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* News tab */}
      {tab === 'news' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Új hír létrehozása</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleCreateNews} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cím <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={e => setNewsTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tartalom <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newsContent}
                  onChange={e => setNewsContent(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategória <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newsCategory}
                  onChange={e => setNewsCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
                  placeholder="pl. Általános, Sport, Tudomány"
                />
              </div>
              {newsError && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{newsError}</p>
              )}
              {newsSuccess && (
                <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">{newsSuccess}</p>
              )}
              <button
                type="submit"
                disabled={newsLoading}
                className="bg-nje text-white px-5 py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
              >
                {newsLoading ? 'Mentés...' : 'Hír közzététele'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Esemény törlése"
          message={`Biztosan törölni szeretnéd a(z) "${deleteTarget.title}" eseményt?`}
          confirmText="Törlés"
          cancelText="Mégse"
          danger={true}
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
