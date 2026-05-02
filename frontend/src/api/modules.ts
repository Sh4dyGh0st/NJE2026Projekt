import client from './client'

export interface EventModule {
  id: number
  eventId: number
  moduleType: string
  title: string
  content: string
  sortOrder: number
}

export interface EventModuleCreateDto {
  moduleType: string
  title: string
  content: string
  sortOrder: number
}

export const getModules = (eventId: number) =>
  client.get<EventModule[]>(`/events/${eventId}/modules`)

export const createModule = (eventId: number, dto: EventModuleCreateDto) =>
  client.post<EventModule>(`/events/${eventId}/modules`, dto)

export const updateModule = (eventId: number, moduleId: number, dto: EventModuleCreateDto) =>
  client.put<EventModule>(`/events/${eventId}/modules/${moduleId}`, dto)

export const deleteModule = (eventId: number, moduleId: number) =>
  client.delete(`/events/${eventId}/modules/${moduleId}`)
