import client from './client'

export interface NewsItem {
  id: number
  title: string
  content: string
  category: string
  createdAt: string
}

export interface NewsCreateDto {
  title: string
  content: string
  category: string
}

export const getNews = () =>
  client.get<NewsItem[]>('/news')

export const getNewsByCategory = (category: string) =>
  client.get<NewsItem[]>(`/news/category/${category}`)

export const createNews = (dto: NewsCreateDto) =>
  client.post<NewsItem>('/news', dto)
