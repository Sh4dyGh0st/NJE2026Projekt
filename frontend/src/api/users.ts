import client from './client'

export interface UserRegisterDto {
  fullName: string
  email: string
  password: string
  institution?: string
}

export interface UserLoginDto {
  email: string
  password: string
}

export interface UserProfile {
  id: number
  fullName: string
  email: string
  institution?: string
  qrToken: string
  role: string
}

export const registerUser = (dto: UserRegisterDto) =>
  client.post<{ message: string }>('/users/register', dto)

export const loginUser = (dto: UserLoginDto) =>
  client.post<{ userId: number; role: string }>('/users/login', dto)

export const getProfile = (id: number) =>
  client.get<UserProfile>(`/users/${id}`)

export const updateRole = (id: number, role: string) =>
  client.patch<{ message: string }>(`/users/${id}/role`, JSON.stringify(role), {
    headers: { 'Content-Type': 'application/json' }
  })

export const deleteAccount = (id: number) =>
  client.delete(`/users/${id}`)
