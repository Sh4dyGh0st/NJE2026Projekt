import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (qrToken: string) => void
  active: boolean
}

export default function QrScanner({ onScan, active }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = 'qr-scanner-container'

  useEffect(() => {
    if (!active) return

    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        onScan(decodedText)
      },
      () => {
        // scan error — ignore, keep scanning
      }
    ).catch(err => {
      console.error('QR scanner start error:', err)
    })

    return () => {
      scanner.isScanning
        ? scanner.stop().catch(() => {})
        : Promise.resolve()
    }
  }, [active, onScan])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id={containerId}
        className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-nje"
      />
      <p className="text-sm text-gray-500">
        Tartsd a QR kódot a kamera elé a beolvasáshoz.
      </p>
    </div>
  )
}
