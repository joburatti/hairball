import { describe, expect, it } from 'vitest'
import { parseDotSource } from './parseDot'
import { parseModelLabel, parseClusterLabel, parsePlainLabel } from './htmlLabel'
import { classifyEdge, inheritanceTypeFromLabel } from './edgeKind'
import { buildGraph } from './buildGraph'

const USER_LABEL =
  '<TABLE BGCOLOR="white" BORDER="0" CELLBORDER="0" CELLSPACING="0">' +
  '<TR><TD COLSPAN="2" CELLPADDING="4" ALIGN="CENTER" BGCOLOR="#1b563f">' +
  '<FONT FACE="Helvetica Bold" COLOR="white">User</FONT></TD></TR>' +
  '<TR><TD ALIGN="LEFT" BORDER="0"><FONT FACE="Helvetica Bold"><B>id</B></FONT></TD>' +
  '<TD ALIGN="LEFT"><FONT FACE="Helvetica Bold"><B>AutoField</B></FONT></TD></TR>' +
  '<TR><TD ALIGN="LEFT" BORDER="0"><FONT COLOR="#7B7B7B" FACE="Helvetica">email</FONT></TD>' +
  '<TD ALIGN="LEFT"><FONT COLOR="#7B7B7B" FACE="Helvetica">CharField</FONT></TD></TR>' +
  '<TR><TD ALIGN="LEFT" BORDER="0"><FONT FACE="Helvetica"><I>created</I></FONT></TD>' +
  '<TD ALIGN="LEFT"><FONT FACE="Helvetica"><I>DateTimeField</I></FONT></TD></TR>' +
  '</TABLE>'

const STUB_LABEL =
  '<TABLE BGCOLOR="white" BORDER="0" CELLBORDER="0" CELLSPACING="0">' +
  '<TR><TD COLSPAN="2" CELLPADDING="4" ALIGN="CENTER" BGCOLOR="#1b563f">' +
  '<FONT FACE="Helvetica Bold" COLOR="white">User</FONT></TD></TR></TABLE>'

const DOT = `digraph model_graph {
  fontname = "Helvetica"
  graph [rankdir="TB"]
  subgraph cluster_accounts {
    label=<<TABLE BORDER="0"><TR><TD><FONT COLOR="Black"><B>accounts</B></FONT></TD></TR></TABLE>>
    accounts_User [label=<${USER_LABEL}>]
    accounts_Profile [label=<${STUB_LABEL.replace(/User/g, 'Profile')}>]
  }
  // stub re-declaration outside the cluster (graph_models needs_node quirk)
  accounts_User [label=<${STUB_LABEL}>]
  accounts_Profile -> accounts_User [label=" user"] [arrowhead=none, arrowtail=dot, dir=both];
  accounts_Profile -> accounts_User [label=" alt_user"] [arrowhead=none, arrowtail=dot, dir=both];
  accounts_Profile -> accounts_User [label="groups (members)"] [arrowhead=dot arrowtail=dot, dir=both];
}`

describe('parseDotSource', () => {
  it('detects clusters and assigns membership', () => {
    const parsed = parseDotSource(DOT)
    expect(parsed.graphName).toBe('model_graph')
    const user = parsed.nodes.find((n) => n.id === 'accounts_User' && n.cluster)
    expect(user?.cluster).toBe('cluster_accounts')
    expect(parsed.clusterLabels.get('cluster_accounts')).toContain('accounts')
  })

  it('merges double attribute lists on one edge statement', () => {
    const parsed = parseDotSource(DOT)
    const edge = parsed.edges[0]
    expect(edge.attrs.label).toBe(' user')
    expect(edge.attrs.arrowtail).toBe('dot')
    expect(edge.attrs.dir).toBe('both')
  })

  it('surfaces HTML labels with the html flag', () => {
    const parsed = parseDotSource(DOT)
    const user = parsed.nodes.find((n) => n.id === 'accounts_User')
    expect(user?.htmlLabel).toBe(true)
    expect(user?.label).toContain('<TABLE')
  })

  it('expands edge chains pairwise', () => {
    const parsed = parseDotSource('digraph g { a -> b -> c; }')
    expect(parsed.edges).toEqual([
      { source: 'a', target: 'b', attrs: {} },
      { source: 'b', target: 'c', attrs: {} },
    ])
  })
})

describe('parseModelLabel', () => {
  it('extracts model name and field rows with flags', () => {
    const { modelName, fields, isAbstract } = parseModelLabel(USER_LABEL)
    expect(modelName).toBe('User')
    expect(isAbstract).toBe(false)
    expect(fields).toEqual([
      { name: 'id', type: 'AutoField', isKeyOrRelation: true, isAbstract: false, isBlank: false },
      { name: 'email', type: 'CharField', isKeyOrRelation: false, isAbstract: false, isBlank: true },
      { name: 'created', type: 'DateTimeField', isKeyOrRelation: false, isAbstract: true, isBlank: false },
    ])
  })

  it('strips the abstract suffix from the header', () => {
    const label = '<TABLE><TR><TD>Base<BR/>&lt;abstract&gt;</TD></TR></TABLE>'
    const { modelName, isAbstract } = parseModelLabel(label)
    expect(modelName).toBe('Base')
    expect(isAbstract).toBe(true)
  })

  it('handles header-only stub labels', () => {
    const { modelName, fields } = parseModelLabel(STUB_LABEL)
    expect(modelName).toBe('User')
    expect(fields).toEqual([])
  })
})

describe('parseClusterLabel / parsePlainLabel', () => {
  it('reads the app name from the bold tag', () => {
    expect(parseClusterLabel('<TABLE><TR><TD><B>django.contrib.auth</B></TD></TR></TABLE>')).toBe(
      'django.contrib.auth',
    )
  })

  it('falls back for record labels', () => {
    expect(parsePlainLabel('{Order|id\\l}').modelName).toBe('Order|id\\l'.split('|')[0].replace(/[{}]/g, ''))
    expect(parsePlainLabel('plain').modelName).toBe('plain')
  })
})

describe('classifyEdge', () => {
  it('matches all graph_models fingerprints', () => {
    expect(classifyEdge({ arrowhead: 'none', arrowtail: 'dot', dir: 'both' })).toBe('fk')
    expect(classifyEdge({ arrowhead: 'dot', arrowtail: 'dot', dir: 'both' })).toBe('m2m')
    expect(classifyEdge({ arrowhead: 'none', arrowtail: 'none', dir: 'both' })).toBe('o2o')
    expect(classifyEdge({ arrowhead: 'empty', arrowtail: 'none', dir: 'both' })).toBe('inheritance')
    expect(classifyEdge({ style: 'dotted', arrowhead: 'normal', arrowtail: 'normal' })).toBe('generic')
  })

  it('treats non-default arrow shapes on the tail as FK', () => {
    expect(classifyEdge({ arrowhead: 'none', arrowtail: 'diamond', dir: 'both' })).toBe('fk')
  })

  it('falls back to unknown', () => {
    expect(classifyEdge({})).toBe('unknown')
  })

  it('extracts inheritance type from edge labels', () => {
    expect(inheritanceTypeFromLabel('abstract\ninheritance')).toBe('abstract')
    expect(inheritanceTypeFromLabel('multi-table\ninheritance')).toBe('multi-table')
    expect(inheritanceTypeFromLabel(' user')).toBeUndefined()
  })
})

describe('buildGraph', () => {
  it('merges stub re-declarations, keeping fields and cluster', () => {
    const graph = buildGraph(parseDotSource(DOT))
    expect(graph.order).toBe(2)
    const user = graph.getNodeAttributes('accounts_User')
    expect(user.label).toBe('User')
    expect(user.fields).toHaveLength(3)
    expect(user.app).toBe('cluster_accounts')
    expect(user.appLabel).toBe('accounts')
  })

  it('keeps parallel edges and assigns spread curvature', () => {
    const graph = buildGraph(parseDotSource(DOT))
    expect(graph.size).toBe(3)
    const curvatures = graph
      .mapEdges((_e, attrs) => attrs)
      .filter((a) => a.type === 'curvedArrow')
      .map((a) => a.curvature)
    expect(curvatures).toHaveLength(3)
    expect(new Set(curvatures).size).toBe(3)
  })

  it('classifies edge kinds and stores trimmed field labels', () => {
    const graph = buildGraph(parseDotSource(DOT))
    const kinds = graph.mapEdges((_e, attrs) => attrs.kind).sort()
    expect(kinds).toEqual(['fk', 'fk', 'm2m'])
    const labels = graph.mapEdges((_e, attrs) => attrs.fieldLabel).sort()
    expect(labels).toEqual(['alt_user', 'groups (members)', 'user'])
  })

  it('sizes nodes by degree', () => {
    const graph = buildGraph(parseDotSource(DOT))
    expect(graph.getNodeAttribute('accounts_User', 'size')).toBeCloseTo(3 + Math.sqrt(3))
  })

  it('creates placeholder nodes for undeclared edge endpoints', () => {
    const graph = buildGraph(parseDotSource('digraph g { a -> b; }'))
    expect(graph.order).toBe(2)
    expect(graph.getNodeAttribute('a', 'label')).toBe('a')
  })
})
