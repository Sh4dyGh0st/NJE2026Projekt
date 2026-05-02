import { test, expect } from '@playwright/test'
import axios from 'axios'
import { uniqueEmail, registerUserViaApi } from './helpers'

const API = 'http://localhost:5000/api'

async function getAdminId(): Promise<number> {
  const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
  return res.data.userId
}

// ============================================================
// ROLE-BASED ACCESS CONTROL TESTS
// ============================================================

test.describe('Navbar role-conditional rendering', () => {
  test('Admin sees Admin felület link in Navbar', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await expect(page.locator('nav').getByRole('link', { name: 'Admin felület' })).toBeVisible()
  })

  test('User does NOT see Admin felület link in Navbar', async ({ page }) => {
    const email = uniqueEmail('navuser')
    await registerUserViaApi(email, 'Test1234!', 'Nav User')

    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await expect(page.locator('nav').getByRole('link', { name: 'Admin felület' })).not.toBeVisible()
  })

  test('Unauthenticated user does NOT see Admin felület link', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('nav')
    await expect(page.locator('nav').getByRole('link', { name: 'Admin felület' })).not.toBeVisible()
  })
})

test.describe('Route protection', () => {
  test('Unauthenticated user redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Unauthenticated user redirected from /admin/scanner to /login', async ({ page }) => {
    await page.goto('/admin/scanner')
    await expect(page).toHaveURL(/\/login/)
  })

  test('User role redirected from /admin to /', async ({ page }) => {
    const email = uniqueEmail('routeuser')
    await registerUserViaApi(email, 'Test1234!', 'Route User')

    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
  })

  test('Admin can access /admin dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForSelector('h1', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Admin felület')
  })
})

test.describe('API role enforcement', () => {
  test('User role cannot POST /events (403)', async () => {
    const email = uniqueEmail('apirole')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'API Role User')

    try {
      await axios.post(`${API}/events`,
        { title: 'Forbidden', description: 'x', location: 'x', startDate: '2026-09-01T09:00:00', endDate: '2026-09-01T17:00:00', maxParticipants: 10 },
        { headers: { 'X-User-Id': userId.toString() } }
      )
      throw new Error('Should have returned 403')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(403)
    }
  })

  test('User role cannot DELETE /registrations/{id} (403)', async () => {
    const email = uniqueEmail('delrole')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Del Role User')

    try {
      await axios.delete(`${API}/registrations/1`,
        { headers: { 'X-User-Id': userId.toString() } }
      )
      throw new Error('Should have returned 403')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(403)
    }
  })

  test('User role cannot POST /news (403)', async () => {
    const email = uniqueEmail('newsrole')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'News Role User')

    try {
      await axios.post(`${API}/news`,
        { title: 'Forbidden', content: 'x', category: 'x' },
        { headers: { 'X-User-Id': userId.toString() } }
      )
      throw new Error('Should have returned 403')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(403)
    }
  })

  test('No auth returns 401 on protected endpoints', async () => {
    const adminId = await getAdminId()
    void adminId

    // POST /events without auth
    try {
      await axios.post(`${API}/events`,
        { title: 'Unauthorized', description: 'x', location: 'x', startDate: '2026-09-01T09:00:00', endDate: '2026-09-01T17:00:00', maxParticipants: 10 }
      )
      throw new Error('Should have returned 401')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(401)
    }
  })

  test('Admin role update endpoint restricted to Admin (403 for User)', async () => {
    const email = uniqueEmail('roleupd')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Role Update User')

    try {
      await axios.patch(`${API}/users/${userId}/role`,
        JSON.stringify('Admin'),
        { headers: { 'Content-Type': 'application/json', 'X-User-Id': userId.toString() } }
      )
      throw new Error('Should have returned 403')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(403)
    }
  })
})
