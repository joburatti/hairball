import { useStore } from '../state/store'
import { RELATION_KIND_META, type RelationEdgeAttrs } from '../types'
import { flyToNode } from '../sigma/camera'
import { themedColor } from '../theme'

interface RelationRow {
  edge: string
  attrs: RelationEdgeAttrs
  neighbor: string
  neighborLabel: string
}

function Row({ row }: { row: RelationRow }) {
  const selectNode = useStore((s) => s.selectNode)
  const setHover = useStore((s) => s.setHover)
  const theme = useStore((s) => s.theme)
  const meta = RELATION_KIND_META[row.attrs.kind]
  const badgeColor = themedColor(meta.color, theme)
  const badgeText =
    row.attrs.kind === 'inheritance' && row.attrs.inheritanceType
      ? row.attrs.inheritanceType
      : meta.label
  return (
    <li
      onClick={() => {
        selectNode(row.neighbor)
        flyToNode(row.neighbor)
      }}
      onMouseEnter={() => setHover(row.neighbor)}
      onMouseLeave={() => setHover(null)}
    >
      <span className="badge" style={{ borderColor: badgeColor, color: badgeColor }}>
        {badgeText}
      </span>
      <span className="relation__field">{row.attrs.fieldLabel}</span>
      <span className="relation__neighbor">{row.neighborLabel}</span>
    </li>
  )
}

export default function RelationList({ node }: { node: string }) {
  const graph = useStore((s) => s.graph)
  if (!graph?.hasNode(node)) return null

  const toRow = (edge: string, other: string): RelationRow => ({
    edge,
    attrs: graph.getEdgeAttributes(edge),
    neighbor: other,
    neighborLabel: graph.getNodeAttribute(other, 'label'),
  })
  const outgoing = graph.mapOutEdges(node, (edge, _a, _s, target) => toRow(edge, target))
  const incoming = graph.mapInEdges(node, (edge, _a, source) => toRow(edge, source))

  return (
    <div className="relations">
      {outgoing.length > 0 && (
        <>
          <h3>Outgoing ({outgoing.length})</h3>
          <ul>
            {outgoing.map((r) => (
              <Row key={r.edge} row={r} />
            ))}
          </ul>
        </>
      )}
      {incoming.length > 0 && (
        <>
          <h3>Incoming ({incoming.length})</h3>
          <ul>
            {incoming.map((r) => (
              <Row key={r.edge} row={r} />
            ))}
          </ul>
        </>
      )}
      {outgoing.length === 0 && incoming.length === 0 && <p className="muted">No relations.</p>}
    </div>
  )
}
