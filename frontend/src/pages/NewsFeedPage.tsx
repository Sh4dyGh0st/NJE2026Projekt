import { useEffect, useState } from 'react'
import { getNews } from '../api/news'
import type { NewsItem } from '../api/news'
import NewsCard from '../components/NewsCard'

export default function NewsFeedPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getNews()
      .then(res => setNews(res.data))
      .catch(() => setError('Nem sikerült betölteni a híreket.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500">
        Betöltés...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-nje mb-6">Hírek</h1>
      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">{error}</p>
      )}
      {news.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Jelenleg nincsenek hírek.</p>
      ) : (
        <div className="space-y-4">
          {news.map(item => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}
    </div>
  )
}
