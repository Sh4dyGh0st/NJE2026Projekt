import type { EventModule } from '../api/modules'

interface Props {
  module: EventModule
}

function getGoogleMapsEmbedUrl(content: string): string {
  // If it's already a full Google Maps URL, convert to embed
  if (content.includes('google.com/maps')) {
    // Convert share/regular URL to embed URL
    const q = encodeURIComponent(content)
    return `https://maps.google.com/maps?q=${q}&output=embed`
  }
  // Otherwise treat as an address/place name
  const q = encodeURIComponent(content)
  return `https://maps.google.com/maps?q=${q}&output=embed`
}

export default function ModuleSection({ module }: Props) {
  const typeLabel =
    module.moduleType === 'InformationPage' ? 'Információ' :
    module.moduleType === 'Map' ? 'Térkép' :
    module.moduleType === 'UsefulInformation' ? 'Hasznos információk' :
    module.moduleType

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
          {module.moduleType === 'Map' ? '📍' :
           module.moduleType === 'InformationPage' ? 'ℹ️' : '💡'} {typeLabel}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{module.title}</h3>

      {module.moduleType === 'Map' ? (
        <div>
          {module.content && (
            <>
              <p className="text-gray-600 text-sm mb-3">{module.content}</p>
              {/* Embedded Google Maps iframe */}
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
                <iframe
                  title={module.title}
                  src={getGoogleMapsEmbedUrl(module.content)}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(module.content)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-nje hover:underline text-sm font-medium"
              >
                📍 Megnyitás Google Maps-ben
              </a>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-600 whitespace-pre-wrap">{module.content}</p>
      )}
    </div>
  )
}
