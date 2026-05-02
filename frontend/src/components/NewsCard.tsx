import type { NewsItem } from '../api/news'

interface Props {
  news: NewsItem
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function NewsCard({ news }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-lg font-semibold text-gray-900">{news.title}</h2>
        <span className="shrink-0 text-xs bg-nje text-white px-2 py-0.5 rounded-full">
          {news.category}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{news.content}</p>
      <p className="text-xs text-gray-400">{formatDate(news.createdAt)}</p>
    </div>
  )
}
