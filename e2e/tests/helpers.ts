import type { Page } from '@playwright/test'
import axios from 'axios'

const API = 'http://localhost:5000/api'

/**
 * Register a new user via the UI registration form.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  fullName: string,
  institution = 'NJE'
) {
  await page.goto('/register')
  await page.getByLabel('Teljes név').fill(fullName)
  await page.getByLabel('E-mail cím').fill(email)
  await page.getByLabel('Intézmény').fill(institution)
  await page.getByLabel('Jelszó').fill(password)
  await page.getByRole('button', { name: 'Regisztráció' }).click()
  // Wait for redirect to /login
  await page.waitForURL('**/login')
}

/**
 * Log in via the UI login form. Returns { userId, role } from sessionStorage.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail cím').fill(email)
  await page.getByLabel('Jelszó').fill(password)
  await page.getByRole('button', { name: 'Bejelentkezés' }).click()
  await page.waitForURL('**/')
  const userId = await page.evaluate(() => sessionStorage.getItem('userId'))
  const role = await page.evaluate(() => sessionStorage.getItem('role'))
  return { userId: userId ? parseInt(userId) : null, role }
}

/**
 * Log in as the seeded admin account.
 */
export async function loginAsAdmin(page: Page) {
  return loginAs(page, 'admin@nje.hu', 'Admin1234!')
}

/**
 * Create an event directly via the API (for test setup).
 * Returns the created event object.
 */
export async function createEventViaApi(adminUserId: number, overrides: Record<string, unknown> = {}) {
  const res = await axios.post(
    `${API}/events`,
    {
      title: 'Teszt Esemény',
      description: 'Automatikus teszt esemény',
      location: 'GAMF Aula',
      room: 'A101',
      startDate: '2026-09-01T09:00:00',
      endDate: '2026-09-01T17:00:00',
      maxParticipants: 100,
      isPublished: true,
      ...overrides
    },
    { headers: { 'X-User-Id': adminUserId.toString() } }
  )
  return res.data
}

/**
 * Register a user for an event directly via the API.
 */
export async function joinEventViaApi(userId: number, eventId: number) {
  const res = await axios.post(
    `${API}/registrations/join`,
    { userId, eventId },
    { headers: { 'X-User-Id': userId.toString() } }
  )
  return res.data
}

/**
 * Register a new user directly via the API (for test setup).
 * Returns { userId, qrToken }.
 */
export async function registerUserViaApi(
  email: string,
  password: string,
  fullName: string
): Promise<{ userId: number; qrToken: string }> {
  await axios.post(`${API}/users/register`, { fullName, email, password, institution: 'NJE' })
  const loginRes = await axios.post(`${API}/users/login`, { email, password })
  const userId = loginRes.data.userId
  const profileRes = await axios.get(`${API}/users/${userId}`, {
    headers: { 'X-User-Id': userId.toString() }
  })
  return { userId, qrToken: profileRes.data.qrToken }
}

/**
 * Generate a unique email for test isolation.
 */
export function uniqueEmail(prefix = 'test') {
  return `${prefix}_${Date.now()}@nje.hu`
}
