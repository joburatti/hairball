/** Categorical palette tuned for a dark background. */
const COLORS = [
  '#5aa9e6', '#f4a261', '#7bd389', '#e76f81', '#c89bf5',
  '#ffd166', '#4ecdc4', '#f78fb3', '#9bb8ff', '#b5e48c',
  '#f9844a', '#74c7ec', '#e9c46a', '#90dbf4', '#d6a2e8',
  '#80ed99', '#ff9f9f', '#a3b18a', '#f2cc8f', '#8ecae6',
]

const UNGROUPED_COLOR = '#7d8089'

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
