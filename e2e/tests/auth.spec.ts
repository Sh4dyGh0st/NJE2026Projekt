import { test, expect } from '@playwright/test'
import { uniqueEmail, registerUserViaApi } from './helpers'

// ============================================================
// AUTH TESTS — Registration, Login, Session, RBAC redirects
// ============================================================

test.describe('Registration', () => {
  test('happy path: register new user and redirect to login', async ({ page }) => {
    const email = uniqueEmail('reg')
    await page.goto('/register')
    await page.waitForSelector('form')

    await page.getByPlaceholder('Kovács János').fill('Teszt Felhasználó')
    await page.getByPlaceholder('pelda@nje.hu').first().fill(email)
    await page.getByPlaceholder('Neumann János Egyetem').fill('NJE')
    await page.getByPlaceholder('Minimum 8 karakter').fill('Test1234!')
    await page.getByRole('button', { name: 'Regisztráció' }).click()

    await expect(page).toHaveURL(/\/login/)
  })

  test('duplicate email shows error', async ({ page }) => {
    const email = uniqueEmail('dup')
    await registerUserViaApi(email, 'Test1234!', 'Dup User')

    await page.goto('/register')
    await page.waitForSelector('form')

    await page.getByPlaceholder('Kovács János').fill('Dup User 2')
    await page.getByPlaceholder('pelda@nje.hu').first().fill(email)
    await page.getByPlaceholder('Minimum 8 karakter').fill('Test1234!')
    await page.getByRole('button', { name: 'Regisztráció' }).click()

    await expect(page.locator('text=már foglalt')).toBeVisible()
  })

  test('short password shows inline validation error', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('form')

    await page.getByPlaceholder('Minimum 8 karakter').fill('short')
    // Trigger blur
    await page.getByPlaceholder('Kovács János').click()

    await expect(page.locator('text=legalább 8 karakter')).toBeVisible()
  })

  test('short password rejected on submit — stays on register page', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('form')

    await page.getByPlaceholder('Kovács János').fill('Short Pass')
    await page.getByPlaceholder('pelda@nje.hu').first().fill(uniqueEmail('short'))
    await page.getByPlaceholder('Minimum 8 karakter').fill('abc')
    await page.getByRole('button', { name: 'Regisztráció' }).click()

    // Should stay on register page (client-side validation blocks submit)
    await expect(page).toHaveURL(/\/register/)
  })

  test('GDPR privacy notice is visible on register page', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('form')
    await expect(page.locator('text=Adatvédelmi tájékoztató')).toBeVisible()
  })
})

test.describe('Login', () => {
  test('happy path: login stores userId and role in sessionStorage', async ({ page }) => {
    const email = uniqueEmail('login')
    await registerUserViaApi(email, 'Test1234!', 'Login User')

    await page.goto('/login')
    await page.waitForSelector('form')

    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()

    await expect(page).toHaveURL(/\/$/)

    const userId = await page.evaluate(() => sessionStorage.getItem('userId'))
    const role = await page.evaluate(() => sessionStorage.getItem('role'))

    expect(userId).not.toBeNull()
    expect(parseInt(userId!)).toBeGreaterThan(0)
    expect(role).toBe('User')
  })

  test('wrong password shows error', async ({ page }) => {
    const email = uniqueEmail('wrongpw')
    await registerUserViaApi(email, 'Test1234!', 'Wrong PW User')

    await page.goto('/login')
    await page.waitForSelector('form')

    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('WrongPassword!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()

    await expect(page.locator('text=Hibás e-mail vagy jelszó')).toBeVisible()
  })

  test('unauthenticated user redirected from /profile to /login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('User role redirected from /admin to /', async ({ page }) => {
    const email = uniqueEmail('userrole')
    await registerUserViaApi(email, 'Test1234!', 'User Role Test')

    await page.goto('/login')
    await page.waitForSelector('form')

    await page.getByPlaceholder('pelda@nje.hu').fill(email)
    await page.getByPlaceholder('••••••••').fill('Test1234!')
    await page.getByRole('button', { name: 'Bejelentkezés' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/$/)
  })
})
