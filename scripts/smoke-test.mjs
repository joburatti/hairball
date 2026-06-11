#!/usr/bin/env node
// Headless end-to-end smoke test. Checks both the dev pipeline (via vite preview)
// and the single-file build opened over file://.
//
// Usage: npm run build:single && node scripts/smoke-test.mjs

import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distIndex = join(root, 'dist', 'index.html')

if (!existsSync(distIndex)) {
  console.error('dist/index.html missing — run `npm run build:single` first')
  process.exit(1)
}

const bigDot = join(root, 'samples', 'big.dot')

let failures = 0
function check(name, ok, extra = '') {
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${extra ? ` (${extra})` : ''}`)
  if (!ok) failures++
}

// channel:'chromium' uses the full chromium build (new headless), avoiding the
// separate chromium_headless_shell download
const browser = await chromium.launch({ channel: 'chromium' })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const pageErrors = []
page.on('pageerror', (err) => pageErrors.push(err.message))

console.log('Opening single-file build over file://')
await page.goto(`file://${distIndex}`)

check('landing page renders', await page.locator('h1', { hasText: 'hairball' }).isVisible())

// Load the demo graph (exercises parse + render + worker layout)
await page.getByRole('button', { name: 'Load demo graph' }).click()
await page.waitForSelector('.toolbar', { timeout: 10_000 })
check('demo graph loads into toolbar', (await page.locator('.toolbar__meta').textContent())?.includes('nodes') ?? false)

// Layout should be running (auto-start) and moving nodes
check('layout auto-starts', await page.locator('button', { hasText: 'Stop layout' }).isVisible())
const shot1 = await page.locator('.graph-view').screenshot()
await page.waitForTimeout(1500)
const shot2 = await page.locator('.graph-view').screenshot()
check('canvas pixels change while layout runs (worker alive under file://)', !shot1.equals(shot2))

// Search → select → sidebar round trip
// "Price" is a well-connected node in the committed demo.dot (seed 7)
await page.keyboard.press('/')
await page.keyboard.type('price')
const firstResult = page.locator('.search__results li').first()
await firstResult.waitFor({ timeout: 5000 })
const pickedModel = await firstResult.locator('.search__model').textContent()
await firstResult.click()
await page.waitForSelector('.node-details h2', { timeout: 5000 })
const sidebarTitle = await page.locator('.node-details h2').textContent()
check('search picks node and sidebar shows it', sidebarTitle?.startsWith(pickedModel ?? '∅') ?? false, `"${sidebarTitle}"`)
check('sidebar shows field table', (await page.locator('.fields tr').count()) > 0)

// Neighbor navigation
const relationRows = await page.locator('.relations li').count()
check('relation list has rows', relationRows > 0, `${relationRows} rows`)
if (relationRows > 0) {
  const neighborName = await page.locator('.relations li').first().locator('.relation__neighbor').textContent()
  await page.locator('.relations li').first().click()
  await page.waitForTimeout(300)
  const newTitle = await page.locator('.node-details h2').textContent()
  check('clicking a relation navigates to the neighbor', newTitle?.startsWith(neighborName ?? '∅') ?? false, `"${newTitle}"`)
}

// Deselect via stage click
await page.locator('.graph-view canvas').last().click({ position: { x: 10, y: 10 } })
await page.waitForTimeout(200)
check('stage click deselects', await page.locator('.sidebar__empty').isVisible())

// App filter present for multi-app demo
check('app filter renders', await page.locator('.app-filter').isVisible())

// Large file: 1500 models via the file input
console.log('Loading 1500-node sample')
const t0 = Date.now()
await page.locator('input[type=file]').first().setInputFiles(bigDot)
await page.waitForFunction(
  () => document.querySelector('.toolbar__meta')?.textContent?.includes('big.dot'),
  { timeout: 30_000 },
)
const loadMs = Date.now() - t0
const meta = await page.locator('.toolbar__meta').textContent()
check('1500-node file loads', meta?.includes('nodes') ?? false, `${loadMs}ms, ${meta?.trim()}`)
check('parse under 5s', loadMs < 5000, `${loadMs}ms`)

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join('; '))

await browser.close()
console.log(failures === 0 ? '\nAll smoke checks passed.' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
