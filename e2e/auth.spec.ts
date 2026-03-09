/**
 * E2E Tests for Authentication Flow
 */

import { expect, test } from '@playwright/test'

test.describe('Authentication - Mock Provider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load page with mock auth', async ({ page }) => {
    await expect(page.locator('h1:has-text("Team Dashboard")')).toBeVisible()
  })

  test('should display dashboard content', async ({ page }) => {
    await expect(page.locator('text=Tickets').first()).toBeVisible()
  })

  test('should display actual staff data', async ({ page }) => {
    await expect(page.locator('text=Tonphai').first()).toBeVisible()
  })
})
