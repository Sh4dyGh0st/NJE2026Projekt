import { test, expect } from '@playwright/test'
import axios from 'axios'
import { uniqueEmail, registerUserViaApi, createEventViaApi } from './helpers'

const API = 'http://localhost:5000/api'

// Helper: get or create admin user
async function getAdminId(): Promise<number> {
  // Use the seeded admin (userId=5, promoted via SQL)
  // If not available, try to find by login
  try {
    const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
    return res.data.userId
  } catch {
    // Create and promote admin
    const email = uniqueEmail('admin_ev')
    const { userId } = await registerUserViaApi(email, 'Admin1234!', 'Event Admin')
    await axios.patch(`${API}/users/${userId}/role`, JSON.stringify('Admin'), {
      headers: { 'Content-Type': 'application/json', 'X-User-Id': '5' }
    })
    return userId
  }
}

test.describe('Event List', () => {
  test('happy path: event list page loads and shows published events', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('h1')
    await expect(page.locator('h1')).toContainText('Események')
  })

  test('event list shows events sorted by start date ascending', async ({ page }) => {
    const adminId = await getAdminId()

    // Create two events with different start dates
    const ev1 = await createEventViaApi(adminId, {
      title: 'Korábbi Esemény',
      startDate: '2026-07-01T09:00:00',
      endDate: '2026-07-01T17:00:00'
    })
    const ev2 = await createEventViaApi(adminId, {
      title: 'Későbbi Esemény',
      startDate: '2026-08-01T09:00:00',
      endDate: '2026-08-01T17:00:00'
    })

    await page.goto('/')
    await page.waitForSelector('[href*="/events/"]')

    // Get all event card titles in order
    const titles = await page.locator('[href*="/events/"] h2').allTextContents()
    const ev1Idx = titles.findIndex(t => t.includes('Korábbi'))
    const ev2Idx = titles.findIndex(t => t.includes('Későbbi'))

    expect(ev1Idx).toBeGreaterThanOrEqual(0)
    expect(ev2Idx).toBeGreaterThanOrEqual(0)
    expect(ev1Idx).toBeLessThan(ev2Idx)

    // Cleanup
    await axios.delete(`${API}/events/${ev1.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev2.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('event detail page shows all event fields', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, {
      title: 'Detail Teszt Esemény',
      description: 'Részletes leírás',
      location: 'GAMF Aula',
      room: 'A101'
    })

    await page.goto(`/events/${ev.id}`)
    await page.waitForSelector('h1')

    await expect(page.locator('h1')).toContainText('Detail Teszt Esemény')
    await expect(page.locator('text=GAMF Aula')).toBeVisible()
    await expect(page.locator('text=Részletes leírás')).toBeVisible()

    // Cleanup
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('non-existent event shows error', async ({ page }) => {
    await page.goto('/events/99999')
    // Wait for the error message to appear
    await expect(page.locator('text=Nem sikerült betölteni')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Management (Admin)', () => {
  test('Admin can create an event via the form', async ({ page }) => {
    const adminId = await getAdminId()
    void adminId // used for cleanup

    // Login as admin
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    // Navigate to create event form
    await page.goto('/admin/events/new')
    await page.waitForSelector('form', { timeout: 10000 })

    // Fill the title field (first text input)
    await page.locator('input[type="text"]').first().fill('UI Teszt Esemény')
    // Fill dates
    await page.locator('input[type="datetime-local"]').first().fill('2026-10-01T09:00')
    await page.locator('input[type="datetime-local"]').last().fill('2026-10-01T17:00')

    await page.getByRole('button', { name: 'Mentés' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/admin/)

    // Cleanup: find and delete the created event
    const events = await axios.get(`${API}/events`)
    const created = events.data.find((e: { title: string; id: number }) => e.title === 'UI Teszt Esemény')
    if (created) {
      await axios.delete(`${API}/events/${created.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    }
  })

  test('create event without title shows validation error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/admin/events/new')
    await page.waitForSelector('form', { timeout: 10000 })

    // Fill title with only whitespace (passes HTML required but fails JS validation)
    await page.locator('input[type="text"]').first().fill('   ')
    await page.locator('input[type="datetime-local"]').first().fill('2026-10-01T09:00')
    await page.locator('input[type="datetime-local"]').last().fill('2026-10-01T17:00')
    await page.getByRole('button', { name: 'Mentés' }).click()

    await expect(page.locator('text=kötelező')).toBeVisible({ timeout: 5000 })
  })

  test('delete event with registrations shows 409 error message', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Törlési Teszt', maxParticipants: 10 })

    // Register a user for the event
    const email = uniqueEmail('deltest')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Del Test User')
    await axios.post(`${API}/registrations/join`,
      { userId, eventId: ev.id },
      { headers: { 'X-User-Id': userId.toString() } }
    )

    // Login as admin
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForSelector('table', { timeout: 10000 })

    // Find and click delete for our event (use first() to avoid strict mode violation)
    const row = page.locator('tr').filter({ hasText: 'Törlési Teszt' }).first()
    await row.getByRole('button', { name: 'Törlés' }).first().click()

    // Confirm the dialog
    await page.getByRole('button', { name: 'Törlés' }).last().click()

    // Should show error about registrations
    await expect(page.locator('text=regisztrált résztvevők')).toBeVisible({ timeout: 10000 })

    // Cleanup: remove registration then delete event
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === userId && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('non-Admin cannot access event create form', async ({ page }) => {
    await page.goto('/admin/events/new')
    await expect(page).toHaveURL(/\/login/)
  })
})
