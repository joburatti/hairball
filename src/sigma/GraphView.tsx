import { useEffect, useRef } from 'react'
import Sigma from 'sigma'
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve'
import { useStore } from '../state/store'
import { getActiveSigma, setActiveSigma } from './camera'
import { makeEdgeReducer, makeNodeReducer, type ReducerState } from './reducers'
import { CANVAS_THEME } from '../theme'

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const graph = useStore((s) => s.graph)
  const graphVersion = useStore((s) => s.graphVersion)

  useEffect(() => {
    if (!graph || !containerRef.current) return

    const initialTheme = CANVAS_THEME[useStore.getState().theme]
    const sigma = new Sigma(graph, containerRef.current, {
      defaultEdgeType: 'arrow',
      edgeProgramClasses: { curvedArrow: EdgeCurvedArrowProgram },
      labelRenderedSizeThreshold: 7,
      labelColor: { color: initialTheme.label },
      labelFont: 'system-ui, sans-serif',
      labelSize: 12,
      defaultEdgeColor: initialTheme.defaultEdge,
      zIndex: true,
      minCameraRatio: 0.01,
      maxCameraRatio: 5,
    })
    setActiveSigma(sigma)

    sigma.on('clickNode', ({ node }) => useStore.getState().selectNode(node))
    sigma.on('clickStage', () => useStore.getState().selectNode(null))
    sigma.on('enterNode', ({ node }) => {
      useStore.getState().setHover(node)
      if (containerRef.current) containerRef.current.style.cursor = 'pointer'
    })
    sigma.on('leaveNode', () => {
      useStore.getState().setHover(null)
      if (containerRef.current) containerRef.current.style.cursor = 'default'
    })

    const applyReducers = () => {
      const s = useStore.getState()
      const state: ReducerState = {
        selected: s.selectedNode,
        neighbors: s.selectedNeighbors,
        hovered: s.hoveredNode,
        enabledApps: s.enabledApps,
        allAppsEnabled: s.enabledApps.size >= s.apps.length,
        theme: s.theme,
      }
      const ct = CANVAS_THEME[s.theme]
      sigma.setSettings({
        nodeReducer: makeNodeReducer(state),
        edgeReducer: makeEdgeReducer(state, graph),
        labelColor: { color: ct.label },
        defaultEdgeColor: ct.defaultEdge,
      })
      sigma.refresh({ skipIndexation: true })
    }
    applyReducers()

    const unsubscribe = useStore.subscribe((s, prev) => {
      if (
        s.selectedNode !== prev.selectedNode ||
        s.hoveredNode !== prev.hoveredNode ||
        s.enabledApps !== prev.enabledApps ||
        s.theme !== prev.theme
      ) {
        applyReducers()
      }
    })

    return () => {
      unsubscribe()
      if (getActiveSigma() === sigma) setActiveSigma(null)
      sigma.kill()
    }
  }, [graph, graphVersion])

  return <div ref={containerRef} className="graph-view" />
}
