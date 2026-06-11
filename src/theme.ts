import { COLORS, LIGHT_COLORS, UNGROUPED_COLOR, UNGROUPED_COLOR_LIGHT } from './sigma/palette'
import { RELATION_KIND_META } from './types'

export type Theme = 'dark' | 'light'

/** Duplicated in the index.html inline script (which can't import TS) — keep in sync. */
export const THEME_STORAGE_KEY = 'hairball-theme'

/**
 * The index.html inline script resolves the theme before first paint and sets
 * `data-theme` on <html>; prefer that so store and DOM can't disagree. The
 * fallbacks repeat its logic for environments without the script (tests).
 */
export function getInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const t = document.documentElement.dataset.theme
    if (t === 'light' || t === 'dark') return t
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable — fall through to OS preference */
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

/** Canvas colors that live in sigma settings/reducers rather than CSS. */
export const CANVAS_THEME: Record<Theme, { label: string; defaultEdge: string; dim: string }> = {
  dark: { label: '#d7d7dc', defaultEdge: '#3a3a40', dim: '#2a2a2e' },
  light: { label: '#2b2b30', defaultEdge: '#c9c9d2', dim: '#e3e3e8' },
}

/**
 * Baked node/edge colors all come from two closed sets (the app palette and
 * RELATION_KIND_META), so a hex map is a complete dark→light translation.
 */
const DARK_TO_LIGHT = new Map<string, string>([
  ...COLORS.map((c, i) => [c, LIGHT_COLORS[i]] as const),
  [UNGROUPED_COLOR, UNGROUPED_COLOR_LIGHT],
  ...Object.values(RELATION_KIND_META).map((m) => [m.color, m.lightColor] as const),
])

/** Translate a baked (dark) color for the active theme. */
export function themedColor(color: string, theme: Theme): string {
  return theme === 'light' ? (DARK_TO_LIGHT.get(color) ?? color) : color
}
