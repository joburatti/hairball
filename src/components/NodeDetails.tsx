import { useStore } from '../state/store'

export default function NodeDetails({ node }: { node: string }) {
  const graph = useStore((s) => s.graph)
  if (!graph?.hasNode(node)) return null
  const attrs = graph.getNodeAttributes(node)

  return (
    <div className="node-details">
      <h2>
        {attrs.label}
        {attrs.isAbstract && <span className="badge badge--abstract">abstract</span>}
      </h2>
      <span className="app-chip" style={{ background: attrs.color }}>
        {attrs.appLabel}
      </span>
      {attrs.fields.length > 0 ? (
        <table className="fields">
          <tbody>
            {attrs.fields.map((f, i) => (
              <tr key={i}>
                <td
                  className={[
                    f.isKeyOrRelation ? 'field--key' : '',
                    f.isAbstract ? 'field--abstract' : '',
                    f.isBlank ? 'field--blank' : '',
                  ].join(' ')}
                >
                  {f.name}
                </td>
                <td className={f.isBlank ? 'field--blank' : ''}>{f.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No field information in this file.</p>
      )}
    </div>
  )
}
