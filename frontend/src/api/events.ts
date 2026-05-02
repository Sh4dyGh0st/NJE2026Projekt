import client from './client'

export interface EventDto {
  id: number
  title: string
  description: string
  location: string
  room?: string
  startDate: string
  endDate: string
  maxParticipants: number
  isPublished: boolean
  registrationCount: number  // returned directly from API
}

export interface EventCreateDto {
  title: string
  description: string
  location: string
  room?: string
  startDate: string
  endDate: string
  maxParticipants: number
  isPublished: boolean
}

export interface ParticipantDto {
  fullName: string
  email: string
  registrationDate: string
  isPresent: boolean
}

export const getEvents = () =>
  client.get<EventDto[]>('/events')

export const getEvent = (id: number) =>
  client.get<EventDto>(`/events/${id}`)

export const createEvent = (dto: EventCreateDto) =>
  client.post<EventDto>('/events', dto)

export const updateEvent = (id: number, dto: EventCreateDto) =>
  client.put<EventDto>(`/events/${id}`, dto)

export const deleteEvent = (id: number) =>
  client.delete(`/events/${id}`)

export const getParticipants = (id: number) =>
  client.get<ParticipantDto[]>(`/events/${id}/participants`)
