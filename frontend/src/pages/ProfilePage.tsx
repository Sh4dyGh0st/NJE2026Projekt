import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProfile, deleteAccount } from '../api/users'
import type { UserProfile } from '../api/users'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ProfilePage() {
  const { userId, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!userId) return
    getProfile(userId)
      .then(res => setProfile(res.data))
      .catch(() => setError('Nem sikerült betölteni a profilt.'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleDeleteAccount = async () => {
    if (!userId) return
    setDeleting(true)
    try {
      await deleteAccount(userId)
      logout()
      navigate('/')
    } catch {
      setError('Nem sikerült törölni a fiókot.')
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-8 text-gray-500">Betöltés...</div>
  if (error || !profile) return <div className="max-w-lg mx-auto px-4 py-8 text-red-600">{error || 'Hiba történt.'}</div>

  const roleLabel = profile.role === 'Admin' ? 'Adminisztrátor' : 'Felhasználó'

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-nje mb-6">Profilom</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">Teljes név</span>
          <p className="font-medium text-gray-900">{profile.fullName}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">E-mail cím</span>
          <p className="font-medium text-gray-900">{profile.email}</p>
        </div>
        {profile.institution && (
          <div>
            <span className="text-sm text-gray-500">Intézmény</span>
            <p className="font-medium text-gray-900">{profile.institution}</p>
          </div>
        )}
        <div>
          <span className="text-sm text-gray-500">Szerepkör</span>
          <p className="font-medium text-gray-900">{roleLabel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/qr"
          className="bg-nje text-white px-4 py-2 rounded font-medium text-center hover:bg-nje-light transition-colors"
        >
          QR-kódom megtekintése
        </Link>
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleting}
          className="border border-red-300 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Fiók törlése
        </button>
      </div>

      {showDeleteDialog && (
        <ConfirmDialog
          title="Fiók törlése"
          message="Biztosan törölni szeretnéd a fiókodat? Ez a művelet nem vonható vissza, és minden regisztrációd törlődik."
          confirmText="Törlés"
          cancelText="Mégse"
          danger={true}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  )
}
