import { useStore } from '../state/store'
import { RELATION_KIND_META } from '../types'
import AppFilter from './AppFilter'
import NodeDetails from './NodeDetails'
import RelationList from './RelationList'

function Legend() {
  return (
    <div className="legend">
      <h3>Legend</h3>
      <ul>
        {(['fk', 'm2m', 'o2o', 'inheritance', 'generic'] as const).map((kind) => (
          <li key={kind}>
            <span className="legend__line" style={{ background: RELATION_KIND_META[kind].color }} />
            {RELATION_KIND_META[kind].label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Sidebar() {
  const selectedNode = useStore((s) => s.selectedNode)
  const graph = useStore((s) => s.graph)
  const fileName = useStore((s) => s.fileName)
  const apps = useStore((s) => s.apps)

  return (
    <aside className="sidebar">
      {selectedNode ? (
        <>
          <NodeDetails node={selectedNode} />
          <RelationList node={selectedNode} />
        </>
      ) : (
        <div className="sidebar__empty">
          <h2>{fileName}</h2>
          <p className="muted">
            {graph?.order ?? 0} models · {graph?.size ?? 0} relations · {apps.length} apps
          </p>
          <p className="muted">
            Click a node to inspect it. Search with <kbd>/</kbd> or <kbd>Ctrl K</kbd>. Click the
            background to deselect.
          </p>
        </div>
      )}
      <div className="sidebar__footer">
        <AppFilter />
        <Legend />
      </div>
    </aside>
  )
}
