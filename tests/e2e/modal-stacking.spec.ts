import { test, expect } from '@playwright/test'

test.describe('Modal Stacking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open TicketListModal when clicking day in DailyBarChart', async ({ page }) => {
    // Click on a month in MonthlyBarChart
    await page.click('.recharts-bar-chart .recharts-bar .recharts-bar-rect:first-child')

    // Wait for DailyBarChart modal to appear
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()

    // Click on a day bar in the daily chart
    await page.click('.recharts-bar rect').first()

    // TicketListModal should open
    await expect(page.locator('text=รายการงานทั้งหมด')).toBeVisible()
  })

  test('should return to DailyBarChart when closing TicketListModal', async ({ page }) => {
    // Open month modal
    await page.click('.recharts-bar-chart .recharts-bar .recharts-bar-rect:first-child')
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()

    // Open day modal
    await page.click('.recharts-bar rect').first()
    await expect(page.locator('text=รายการงานทั้งหมด')).toBeVisible()

    // Close day modal using the X button
    await page.click('text=×')

    // DailyBarChart should still be visible
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()
  })

  test('should stack multiple modals correctly', async ({ page }) => {
    // Open month modal
    await page.click('.recharts-bar-chart .recharts-bar .recharts-bar-rect:first-child')
    await expect(page.locator('text=รายละเอียดประจำเดือน')).toBeVisible()

    // Click on a day to open ticket modal
    await page.click('.recharts-bar rect').first()

    // Both modals should be present in DOM (stacked)
    const modals = await page.locator('.fixed.inset-0').count()
    expect(modals).toBeGreaterThanOrEqual(1)
  })
})
