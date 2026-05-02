import { test, expect } from '@playwright/test'
import axios from 'axios'
import { uniqueEmail, registerUserViaApi, createEventViaApi } from './helpers'

const API = 'http://localhost:5000/api'
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getAdminId(): Promise<number> {
  const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
  return res.data.userId
}

// ============================================================
// QR CODE TESTS
// ============================================================

test.describe('QR Code Display', () => {
  test('happy path: QR code page renders SVG image and full name', async ({ page }) => {
    const email = uniqueEmail('qrhappy')
    await registerUserViaApi(email, 'Test1234!', 'QR Happy User')

    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/qr')
    await page.waitForSelector('svg', { timeout: 10000 })

    // QR SVG should be rendered
    await expect(page.locator('svg')).toBeVisible()

    // Full name should be displayed
    await expect(page.locator('text=QR Happy User')).toBeVisible()
  })

  test('QR token is a valid UUID v4', async ({ page }) => {
    const email = uniqueEmail('qruuid')
    const { qrToken } = await registerUserViaApi(email, 'Test1234!', 'QR UUID User')

    // Verify the token is a valid UUID v4
    expect(qrToken).toMatch(UUID_V4_REGEX)

    // Also verify it's consistent across multiple API calls
    const loginRes = await axios.post(`${API}/users/login`, { email, password: 'Test1234!' })
    const userId = loginRes.data.userId
    const profileRes = await axios.get(`${API}/users/${userId}`, {
      headers: { 'X-User-Id': userId.toString() }
    })
    expect(profileRes.data.qrToken).toBe(qrToken)
    expect(profileRes.data.qrToken).toMatch(UUID_V4_REGEX)
  })

  test('QR token is unique per user', async () => {
    const email1 = uniqueEmail('qruniq1')
    const email2 = uniqueEmail('qruniq2')
    const { qrToken: token1 } = await registerUserViaApi(email1, 'Test1234!', 'QR Unique 1')
    const { qrToken: token2 } = await registerUserViaApi(email2, 'Test1234!', 'QR Unique 2')

    expect(token1).not.toBe(token2)
    expect(token1).toMatch(UUID_V4_REGEX)
    expect(token2).toMatch(UUID_V4_REGEX)
  })

  test('QR code page minimum size is 200x200', async ({ page }) => {
    const email = uniqueEmail('qrsize')
    await registerUserViaApi(email, 'Test1234!', 'QR Size User')

    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto('/qr')
    await page.waitForSelector('svg', { timeout: 10000 })

    // Check SVG dimensions
    const svgBox = await page.locator('svg').boundingBox()
    expect(svgBox).not.toBeNull()
    expect(svgBox!.width).toBeGreaterThanOrEqual(200)
    expect(svgBox!.height).toBeGreaterThanOrEqual(200)
  })
})

test.describe('Check-in (Admin)', () => {
  test('happy path: check-in with valid QR token marks registration as present', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Check-in Teszt', maxParticipants: 50 })

    const email = uniqueEmail('checkin')
    const { userId, qrToken } = await registerUserViaApi(email, 'Test1234!', 'Check-in User')

    // Register for event
    await axios.post(`${API}/registrations/join`,
      { userId, eventId: ev.id },
      { headers: { 'X-User-Id': userId.toString() } }
    )

    // Check-in via API
    const res = await axios.post(`${API}/registrations/checkin`,
      { qrData: qrToken, eventId: ev.id },
      { headers: { 'X-User-Id': adminId.toString() } }
    )

    expect(res.status).toBe(200)
    expect(res.data.fullName).toBe('Check-in User')
    expect(res.data.isPresent).toBe(true)

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === userId && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('check-in idempotency: double check-in returns 200 not error', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Idempotens Check-in', maxParticipants: 50 })

    const email = uniqueEmail('idem')
    const { userId, qrToken } = await registerUserViaApi(email, 'Test1234!', 'Idempotent User')

    await axios.post(`${API}/registrations/join`,
      { userId, eventId: ev.id },
      { headers: { 'X-User-Id': userId.toString() } }
    )

    // First check-in
    const res1 = await axios.post(`${API}/registrations/checkin`,
      { qrData: qrToken, eventId: ev.id },
      { headers: { 'X-User-Id': adminId.toString() } }
    )
    expect(res1.status).toBe(200)

    // Second check-in — should also return 200 (idempotent)
    const res2 = await axios.post(`${API}/registrations/checkin`,
      { qrData: qrToken, eventId: ev.id },
      { headers: { 'X-User-Id': adminId.toString() } }
    )
    expect(res2.status).toBe(200)
    expect(res2.data.isPresent).toBe(true)

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === userId && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('check-in with unknown QR token returns 404', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Unknown QR Teszt', maxParticipants: 50 })

    try {
      await axios.post(`${API}/registrations/checkin`,
        { qrData: '00000000-0000-4000-8000-000000000000', eventId: ev.id },
        { headers: { 'X-User-Id': adminId.toString() } }
      )
      throw new Error('Should have returned 404')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(404)
    }

    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('check-in for unregistered user returns 404', async () => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Unregistered Check-in', maxParticipants: 50 })

    // Create user but don't register for event
    const email = uniqueEmail('unreg')
    const { qrToken } = await registerUserViaApi(email, 'Test1234!', 'Unregistered User')

    try {
      await axios.post(`${API}/registrations/checkin`,
        { qrData: qrToken, eventId: ev.id },
        { headers: { 'X-User-Id': adminId.toString() } }
      )
      throw new Error('Should have returned 404')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number } }
      expect(axiosErr.response?.status).toBe(404)
    }

    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })
})
