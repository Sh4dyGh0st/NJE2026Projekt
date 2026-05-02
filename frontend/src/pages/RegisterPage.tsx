import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/users'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A jelszónak legalább 8 karakter hosszúnak kell lennie!')
      return
    }

    setLoading(true)
    try {
      await registerUser({ fullName, email, password, institution: institution || undefined })
      navigate('/login')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: string } }
      setError(axiosErr.response?.data || 'Regisztrációs hiba történt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-nje mb-6 text-center">Regisztráció</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="pelda@nje.hu"
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
            {password.length > 0 && password.length < 8 && (
              <p className="text-red-500 text-xs mt-1">A jelszónak legalább 8 karakter hosszúnak kell lennie!</p>
            )}
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nje text-white py-2 rounded font-medium hover:bg-nje-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </form>

        {/* GDPR privacy notice */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">
          <strong>Adatvédelmi tájékoztató:</strong> A regisztráció során megadott adatokat (teljes név, e-mail cím, intézmény) kizárólag az NJE eseménykezelő platform működtetéséhez használjuk fel. Az adatokat harmadik félnek nem adjuk át. A GDPR alapján bármikor kérheted adataid törlését.
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Már van fiókod?{' '}
          <Link to="/login" className="text-nje hover:underline font-medium">
            Jelentkezz be
          </Link>
        </p>
      </div>
    </div>
  )
}
