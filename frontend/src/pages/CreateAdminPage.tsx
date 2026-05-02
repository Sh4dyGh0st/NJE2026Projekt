import { useState, type FormEvent } from 'react'
import client from '../api/client'

// Secret admin creation page — accessible only via direct URL: /create-admin
// Requires the admin secret code configured in backend appsettings.json

export default function CreateAdminPage() {
  const [adminSecret, setAdminSecret] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institution, setInstitution] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie!')
      return
    }

    setLoading(true)
    try {
      const res = await client.post<{ message: string; userId: number }>('/users/create-admin', {
        adminSecret,
        fullName,
        email,
        password,
        institution: institution || undefined
      })
      setSuccess(`${res.data.message} (ID: ${res.data.userId})`)
      setFullName('')
      setEmail('')
      setPassword('')
      setInstitution('')
      setAdminSecret('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string; status?: number } }
      if (axiosErr.response?.status === 403) {
        setError('Érvénytelen admin kód.')
      } else {
        setError(axiosErr.response?.data || 'Hiba történt.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-6 text-sm text-yellow-800">
          ⚠️ Ez az oldal csak közvetlen URL-en érhető el: <code>/create-admin</code>
        </div>

        <h1 className="text-2xl font-bold text-nje mb-6 text-center">Admin fiók létrehozása</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin kód <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={adminSecret}
              onChange={e => setAdminSecret(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder="Titkos kód"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teljes név <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder="Kovács János"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail cím <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder="admin@nje.hu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intézmény (opcionális)
            </label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder="Neumann János Egyetem"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jelszó <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nje"
              placeholder="Minimum 8 karakter"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded px-3 py-2">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nje text-white py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Létrehozás...' : 'Admin fiók létrehozása'}
          </button>
        </form>
      </div>
    </div>
  )
}
