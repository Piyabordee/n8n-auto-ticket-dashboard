/**
 * E2E Tests for Create Ticket Page
 */

import { expect, test } from '@playwright/test'

test.describe('Create Ticket Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create')
  })

  test('should load create ticket page', async ({ page }) => {
    // Title is "IT Helpdesk Admin"
    await expect(page).toHaveTitle(/IT Helpdesk Admin/)
  })

  test('should display form elements', async ({ page }) => {
    // Check for select elements
    const selects = page.locator('select')
    await expect(selects.first()).toBeVisible()

    // Check for text inputs
    const textInput = page.locator('input[type="text"]')
    await expect(textInput.first()).toBeVisible()

    // Check for textarea
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
  })

  test('should display submit button', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('Create Ticket - Responsive', () => {
  test('should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/create')
    await expect(page.locator('select').first()).toBeVisible()
  })
})
