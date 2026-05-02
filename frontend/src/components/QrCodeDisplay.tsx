import { QRCodeSVG } from 'qrcode.react'

interface Props {
  qrToken: string
  fullName: string
}

export default function QrCodeDisplay({ qrToken, fullName }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <QRCodeSVG
          value={qrToken}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-lg font-semibold text-gray-800">{fullName}</p>
      <p className="text-xs text-gray-400 font-mono break-all max-w-xs text-center">{qrToken}</p>
    </div>
  )
}
