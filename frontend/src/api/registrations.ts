import client from './client'

export interface RegistrationJoinDto {
  userId: number
  eventId: number
}

export interface CheckInDto {
  qrData: string
  eventId: number
}

export const joinEvent = (dto: RegistrationJoinDto) =>
  client.post<{ message: string }>('/registrations/join', dto)

export const leaveEvent = (eventId: number) =>
  client.delete<{ message: string }>(`/registrations/leave/${eventId}`)

export const checkin = (dto: CheckInDto) =>
  client.post<{ message: string; fullName: string; isPresent: boolean }>('/registrations/checkin', dto)

export const removeRegistration = (id: number) =>
  client.delete(`/registrations/${id}`)
