import { test, expect } from '@playwright/test'
import axios from 'axios'

const API = 'http://localhost:5000/api'

async function getAdminId(): Promise<number> {
  const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
  return res.data.userId
}

async function createNewsViaApi(adminId: number, title: string, category = 'General') {
  const res = await axios.post(`${API}/news`,
    { title, content: `Content for ${title}`, category },
    { headers: { 'X-User-Id': adminId.toString() } }
  )
  return res.data
}

// ============================================================
// NEWS FEED TESTS
// ============================================================

test.describe('News Feed', () => {
  test('happy path: news feed page loads and shows news items', async ({ page }) => {
    const adminId = await getAdminId()
    await createNewsViaApi(adminId, 'Teszt Hír ' + Date.now())

    await page.goto('/news')
    await page.waitForSelector('h1', { timeout: 10000 })

    await expect(page.locator('h1')).toContainText('Hírek')
    // At least one news card should be visible
    await expect(page.locator('.space-y-4 > div').first()).toBeVisible()
  })

  test('news items are ordered by createdAt descending', async () => {
    const adminId = await getAdminId()

    // Create two news items with a delay to ensure different timestamps
    const n1 = await createNewsViaApi(adminId, 'Régebbi Hír')
    await new Promise(r => setTimeout(r, 100))
    const n2 = await createNewsViaApi(adminId, 'Újabb Hír')

    const res = await axios.get(`${API}/news`)
    const items = res.data as { id: number; createdAt: string }[]

    const idx1 = items.findIndex(i => i.id === n1.id)
    const idx2 = items.findIndex(i => i.id === n2.id)

    // n2 (newer) should appear before n1 (older) in the list
    expect(idx2).toBeLessThan(idx1)
  })

  test('news category filter is case-insensitive', async () => {
    const adminId = await getAdminId()
    await createNewsViaApi(adminId, 'Sport Hír', 'Sport')

    const upper = await axios.get(`${API}/news/category/SPORT`)
    const lower = await axios.get(`${API}/news/category/sport`)
    const mixed = await axios.get(`${API}/news/category/Sport`)

    expect(upper.data.length).toBeGreaterThan(0)
    expect(lower.data.length).toBe(upper.data.length)
    expect(mixed.data.length).toBe(upper.data.length)
  })

  test('Admin can create news from dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill('admin@nje.hu')
    await page.getByPlaceholder('••••••••').fill('Admin1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForSelector('button', { timeout: 10000 })

    // Switch to news tab
    await page.getByRole('button', { name: 'Hírek' }).click()
    await page.waitForSelector('form', { timeout: 5000 })

    const newsTitle = 'Dashboard Teszt Hír ' + Date.now()
    await page.locator('input[type="text"]').first().fill(newsTitle)
    await page.locator('textarea').fill('Teszt tartalom')
    await page.locator('input[placeholder*="Általános"]').fill('Teszt')
    await page.getByRole('button', { name: 'Hír közzététele' }).click()

    // Success message should appear
    await expect(page.locator('text=sikeresen létrehozva')).toBeVisible({ timeout: 5000 })

    // News should appear on the news feed page
    await page.goto('/news')
    await page.waitForSelector('h1', { timeout: 10000 })
    await expect(page.locator(`text=${newsTitle}`)).toBeVisible()
  })

  test('POST news without auth returns 401', async () => {
    try {
      await axios.post(`${API}/news`, { title: 'Unauthorized', content: 'x', category: 'x' })
      throw new Error('Should have returned 401')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(401)
    }
  })

  test('POST news with User role returns 403', async () => {
    // Use a regular user
    const loginRes = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
    // Find a User-role account or use userId=2
    try {
      await axios.post(`${API}/news`,
        { title: 'Forbidden', content: 'x', category: 'x' },
        { headers: { 'X-User-Id': '2' } } // userId=2 is a regular User
      )
      throw new Error('Should have returned 403')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(403)
    }
    void loginRes
  })
})
