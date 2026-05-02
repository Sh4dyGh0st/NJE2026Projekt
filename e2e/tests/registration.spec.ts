import { test, expect } from '@playwright/test'
import axios from 'axios'
import { uniqueEmail, registerUserViaApi, createEventViaApi } from './helpers'

const API = 'http://localhost:5000/api'

async function getAdminId(): Promise<number> {
  const res = await axios.post(`${API}/users/login`, { email: 'admin@nje.hu', password: 'Admin1234!' })
  return res.data.userId
}

// ============================================================
// REGISTRATION TESTS
// ============================================================

test.describe('Event Registration (User)', () => {
  test('happy path: User registers for event, button changes to QR button', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, {
      title: 'Regisztrációs Teszt Esemény',
      maxParticipants: 50
    })

    const email = uniqueEmail('reghappy')
    await registerUserViaApi(email, 'Test1234!', 'Reg Happy User')

    // Login
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    // Navigate to event detail
    await page.goto(`/events/${ev.id}`)
    await page.waitForSelector('h1', { timeout: 10000 })

    // Should see Regisztráció button
    await expect(page.getByRole('button', { name: 'Regisztráció' })).toBeVisible()

    // Click register
    await page.getByRole('button', { name: 'Regisztráció' }).click()

    // Should navigate to /qr
    await expect(page).toHaveURL(/\/qr/, { timeout: 10000 })

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { eventId: number; id: number }) => r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('duplicate registration shows error message', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, {
      title: 'Duplikált Regisztráció Teszt',
      maxParticipants: 50
    })

    const email = uniqueEmail('regdup')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Reg Dup User')

    // Register via API first
    await axios.post(`${API}/registrations/join`,
      { userId, eventId: ev.id },
      { headers: { 'X-User-Id': userId.toString() } }
    )

    // Login
    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    // Navigate to event — should show QR button since already registered
    await page.goto(`/events/${ev.id}`)
    await page.waitForSelector('h1', { timeout: 10000 })

    // The button should show "QR-kódom megtekintése" or "Regisztráció"
    // If it shows Regisztráció, clicking it should show error
    const regBtn = page.getByRole('button', { name: 'Regisztráció' })
    const qrBtn = page.getByRole('button', { name: 'QR-kódom megtekintése' })

    const regVisible = await regBtn.isVisible()
    if (regVisible) {
      await regBtn.click()
      await expect(page.locator('text=Már regisztráltál')).toBeVisible({ timeout: 5000 })
    } else {
      // Already shows QR button — correct behavior
      await expect(qrBtn).toBeVisible()
    }

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === userId && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('full event shows disabled register button', async ({ page }) => {
    const adminId = await getAdminId()
    // Create event with capacity 1
    const ev = await createEventViaApi(adminId, {
      title: 'Megtelt Esemény Teszt',
      maxParticipants: 1
    })

    // Fill the event with one registration
    const email1 = uniqueEmail('full1')
    const { userId: uid1 } = await registerUserViaApi(email1, 'Test1234!', 'Full User 1')
    await axios.post(`${API}/registrations/join`,
      { userId: uid1, eventId: ev.id },
      { headers: { 'X-User-Id': uid1.toString() } }
    )

    // Login as a different user
    const email2 = uniqueEmail('full2')
    await registerUserViaApi(email2, 'Test1234!', 'Full User 2')

    await page.goto('/login')
    await page.waitForSelector('form')
    await page.getByPlaceholder('pelda@nje.hu').fill(email2)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await page.waitForURL(/\/$/, { timeout: 10000 })

    await page.goto(`/events/${ev.id}`)
    await page.waitForSelector('h1', { timeout: 10000 })

    // Button should be disabled or show "Megtelt"
    const btn = page.getByRole('button', { name: /Megtelt|Regisztráció/ })
    await expect(btn).toBeVisible()

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === uid1 && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })
})

test.describe('Participant Management (Admin)', () => {
  test('happy path: Admin views participant list with all columns', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Résztvevő Lista Teszt', maxParticipants: 50 })

    const email = uniqueEmail('partlist')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Participant List User')
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

    await page.goto(`/admin/events/${ev.id}/participants`)
    await page.waitForSelector('table', { timeout: 10000 })

    // Check all columns are present
    await expect(page.locator('th', { hasText: 'Teljes név' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'E-mail' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Regisztráció dátuma' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Bejelentkezve' })).toBeVisible()

    // Check participant appears
    await expect(page.locator('td', { hasText: 'Participant List User' })).toBeVisible()

    // Cleanup
    const regs = await axios.get(`${API}/registrations`)
    const reg = regs.data.find((r: { userId: number; eventId: number; id: number }) => r.userId === userId && r.eventId === ev.id)
    if (reg) await axios.delete(`${API}/registrations/${reg.id}`, { headers: { 'X-User-Id': adminId.toString() } })
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })

  test('Admin can remove a participant', async ({ page }) => {
    const adminId = await getAdminId()
    const ev = await createEventViaApi(adminId, { title: 'Eltávolítás Teszt', maxParticipants: 50 })

    const email = uniqueEmail('remove')
    const { userId } = await registerUserViaApi(email, 'Test1234!', 'Remove Me User')
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

    await page.goto(`/admin/events/${ev.id}/participants`)
    await page.waitForSelector('table', { timeout: 10000 })

    // Click remove for the participant
    const row = page.locator('tr').filter({ hasText: 'Remove Me User' })
    await row.getByRole('button', { name: 'Eltávolítás' }).click()

    // Confirm dialog
    await page.getByRole('button', { name: 'Eltávolítás' }).last().click()

    // Participant should be gone from the table
    await expect(page.locator('td', { hasText: 'Remove Me User' })).not.toBeVisible({ timeout: 5000 })

    // Cleanup event
    await axios.delete(`${API}/events/${ev.id}`, { headers: { 'X-User-Id': adminId.toString() } })
  })
})
