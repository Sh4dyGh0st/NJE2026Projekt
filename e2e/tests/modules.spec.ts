import { test, expect } from '@playwright/test'
import axios from 'axios'
import { createEventViaApi } from './helpers'

const API = 'http://localhost:5000/api'

async function getAdminId(): Promise<number> {
  const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
  return res.data.userId
}

async function createModuleViaApi(
  adminId: number,
  eventId: number,
  moduleType: string,
  title: string,
  content: string,
  sortOrder = 0
) {
  const res = await axios.post(
    `${API}/events/${eventId}/modules`,
    { moduleType, title, content, sortOrder },
    { headers: { 'X-User-Id': adminId.toString() } }
  )
  return res.data
}

// ============================================================
// EVENT MODULES TESTS
// ============================================================

test.describe('Event Modules', () => {
  test('happy path: Admin creates all three module types and they appear on event detail', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Modul Teszt Esemény' })

    // Create all three module types
    await createModuleViaApi(adminId, ev.id, 'InformationPage', 'Helyszín Info', 'GAMF Aula, 1. emelet', 1)
    await createModuleViaApi(adminId, ev.id, 'Map', 'Térkép', 'https://maps.google.com/?q=Kecskemet', 2)
    await createModuleViaApi(adminId, ev.id, 'UsefulInformation', 'Hasznos Infók', 'Parkolás ingyenes', 3)

    // Navigate to event detail page
    await page.goto(`/events/${ev.id}`)
    await page.waitForSelector('h1', { timeout: 10000 })

    // All three modules should be visible
    await expect(page.locator('text=Helyszín Info')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Térkép' })).toBeVisible()
    await expect(page.locator('text=Hasznos Infók')).toBeVisible()

    // Map module should show a link
    await expect(page.locator('text=Térkép megnyitása')).toBeVisible()

    // Cleanup
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('module round-trip: created module fields are intact on GET', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Round-trip Teszt' })

    const created = await createModuleViaApi(
      adminId, ev.id, 'UsefulInformation', 'Round-trip Cím', 'Round-trip Tartalom', 5
    )

    // Fetch modules and verify fields
    const res = await axios.get(`${API}/events/${ev.id}/modules`)
    const module = res.data.find((m: { id: number }) => m.id === created.id)

    expect(module).toBeDefined()
    expect(module.moduleType).toBe('UsefulInformation')
    expect(module.title).toBe('Round-trip Cím')
    expect(module.content).toBe('Round-trip Tartalom')
    expect(module.sortOrder).toBe(5)

    // Cleanup
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('modules are ordered by sortOrder', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Sorrend Teszt' })

    await createModuleViaApi(adminId, ev.id, 'InformationPage', 'Harmadik', 'x', 3)
    await createModuleViaApi(adminId, ev.id, 'InformationPage', 'Első', 'x', 1)
    await createModuleViaApi(adminId, ev.id, 'InformationPage', 'Második', 'x', 2)

    const res = await axios.get(`${API}/events/${ev.id}/modules`)
    const titles = res.data.map((m: { title: string }) => m.title)

    expect(titles[0]).toBe('Első')
    expect(titles[1]).toBe('Második')
    expect(titles[2]).toBe('Harmadik')

    // Cleanup
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('GET modules for non-existent event returns 404', async () => {
    try {
      await axios.get(`${API}/events/99999/modules`)
      throw new Error('Should have returned 404')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(404)
    }
  })

  test('POST module without auth returns 401', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Auth Teszt Modul' })

    try {
      await axios.post(`${API}/events/${ev.id}/modules`,
        { moduleType: 'InformationPage', title: 'x', content: 'x', sortOrder: 0 }
      )
      throw new Error('Should have returned 401')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(401)
    }

    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })
})
