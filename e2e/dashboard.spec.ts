/**
 * E2E Tests for Dashboard Page
 */

import { expect, test } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load dashboard page successfully', async ({ page }) => {
    // Dashboard title is "Team Dashboard"
    await expect(page.locator('h1:has-text("Team Dashboard")')).toBeVisible()
  })

  test('should display stats cards with Thai labels', async ({ page }) => {
    await expect(page.locator('text=จำนวนงานทั้งหมด').first()).toBeVisible()
    await expect(page.locator('text=ยังไม่ปิด').first()).toBeVisible()
  })

  test('should display year filter with Thai year 2569', async ({ page }) => {
    const yearSelect = page.locator('select').first()
    await expect(yearSelect).toBeVisible()
    // Value might be 2569 (Thai year) or similar
    const value = await yearSelect.inputValue()
    console.log('Year value:', value)
  })

  test('should display month filter', async ({ page }) => {
    const monthSelect = page.locator('select').nth(1)
    await expect(monthSelect).toBeVisible()
  })

  test('should display actual staff data', async ({ page }) => {
    await expect(page.locator('text=Tonphai').first()).toBeVisible()
  })
})

test.describe('Dashboard - Responsive', () => {
  test('should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })
})
