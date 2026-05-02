import { useEffect, useState } from 'react'
import { getProfile } from '../api/users'
import type { UserProfile } from '../api/users'
import { useAuth } from '../context/AuthContext'
import QrCodeDisplay from '../components/QrCodeDisplay'

export default function QrCodePage() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    getProfile(userId)
      .then(res => setProfile(res.data))
      .catch(() => setError('Nem sikerült betölteni a QR kódot.'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-gray-500">
        Betöltés...
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center text-red-600">
        {error || 'Hiba történt.'}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-nje mb-2 text-center">Az én QR kódom</h1>
      <p className="text-gray-500 text-center mb-8 text-sm">
        Mutasd ezt a kódot a beléptetőnek az eseményen.
      </p>
      <QrCodeDisplay qrToken={profile.qrToken} fullName={profile.fullName} />
    </div>
  )
}
