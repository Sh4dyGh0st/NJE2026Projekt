import { useState } from 'react'
import type { ParticipantDto } from '../api/events'
import ConfirmDialog from './ConfirmDialog'

interface ParticipantWithId extends ParticipantDto {
  registrationId: number
}

interface Props {
  participants: ParticipantWithId[]
  onRemove: (registrationId: number) => Promise<void>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function ParticipantTable({ participants, onRemove }: Props) {
  const [removeTarget, setRemoveTarget] = useState<ParticipantWithId | null>(null)
  const [removing, setRemoving] = useState(false)

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await onRemove(removeTarget.registrationId)
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  if (participants.length === 0) {
    return <p className="text-gray-500 py-8 text-center">Nincsenek regisztrált résztvevők.</p>
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Teljes név</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">E-mail</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Regisztráció dátuma</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Bejelentkezve</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Műveletek</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participants.map(p => (
              <tr key={p.registrationId} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{p.email}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(p.registrationDate)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isPresent ? 'Igen' : 'Nem'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setRemoveTarget(p)}
                    disabled={removing}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Eltávolítás
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Résztvevő eltávolítása"
          message={`Biztosan eltávolítod ${removeTarget.fullName} regisztrációját?`}
          confirmText="Eltávolítás"
          cancelText="Mégse"
          danger={true}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </>
  )
}
