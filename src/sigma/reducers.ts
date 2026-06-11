import type { Attributes } from 'graphology-types'
import { appKey } from '../state/store'
import { CANVAS_THEME, themedColor, type Theme } from '../theme'

export interface ReducerState {
  selected: string | null
  neighbors: Set<string>
  hovered: string | null
  enabledApps: Set<string>
  allAppsEnabled: boolean
  theme: Theme
}

export function makeNodeReducer(state: ReducerState) {
  const { selected, neighbors, hovered, enabledApps, allAppsEnabled, theme } = state
  const dimColor = CANVAS_THEME[theme].dim
  return (node: string, data: Attributes): Attributes => {
    if (!allAppsEnabled && !enabledApps.has(appKey(data.app ?? null))) {
      return { ...data, hidden: true }
    }
    const color = themedColor(data.color, theme)
    if (node === hovered && node !== selected) {
      return { ...data, color, highlighted: true, zIndex: 2 }
    }
    if (selected) {
      if (node === selected) {
        return { ...data, color, highlighted: true, size: data.size * 1.4, zIndex: 3 }
      }
      if (neighbors.has(node)) {
        return { ...data, color, forceLabel: true, zIndex: 2 }
      }
      return { ...data, color: dimColor, label: null, zIndex: 0 }
    }
    return theme === 'light' ? { ...data, color } : data
  }
}

export function makeEdgeReducer(state: ReducerState, graph: { hasExtremity: (edge: string, node: string) => boolean }) {
  const { selected, theme } = state
  return (edge: string, data: Attributes): Attributes => {
    if (selected) {
      if (graph.hasExtremity(edge, selected)) {
        return { ...data, color: themedColor(data.color, theme), zIndex: 1, size: (data.size ?? 1) + 0.6 }
      }
      return { ...data, hidden: true }
    }
    return theme === 'light' ? { ...data, color: themedColor(data.color, theme) } : data
  }
}
