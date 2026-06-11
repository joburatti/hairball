/** Categorical palette tuned for a dark background. These are the canonical
 * baked node colors; LIGHT_COLORS holds the index-matched light-theme twins. */
export const COLORS = [
  '#5aa9e6', '#f4a261', '#7bd389', '#e76f81', '#c89bf5',
  '#ffd166', '#4ecdc4', '#f78fb3', '#9bb8ff', '#b5e48c',
  '#f9844a', '#74c7ec', '#e9c46a', '#90dbf4', '#d6a2e8',
  '#80ed99', '#ff9f9f', '#a3b18a', '#f2cc8f', '#8ecae6',
]

/** Same hues, darkened/saturated to stay readable on a light background. */
export const LIGHT_COLORS = [
  '#2a7ab8', '#d9742e', '#3a9e52', '#c94257', '#8f5cd6',
  '#cf9b1d', '#1f9e95', '#d4567f', '#5e7fd6', '#7aa83f',
  '#d65a1f', '#2f96c4', '#bb8f23', '#3ba6c9', '#a766c2',
  '#2f9e63', '#d96262', '#74854f', '#c08a3e', '#4a92b8',
]

export const UNGROUPED_COLOR = '#7d8089'
export const UNGROUPED_COLOR_LIGHT = '#6b6e78'

/** Stable app → color assignment, in first-seen order. */
export function makePalette(): (app: string | null) => string {
  const assigned = new Map<string, string>()
  return (app) => {
    if (app === null) return UNGROUPED_COLOR
    let color = assigned.get(app)
    if (!color) {
      color = COLORS[assigned.size % COLORS.length]
      assigned.set(app, color)
    }
    return color
  }
}
