#!/usr/bin/env node
// Synthesizes django-extensions graph_models-style .dot output for testing.
// Usage: node scripts/generate-sample.mjs --apps 25 --models 1500 [--seed 42] > samples/big.dot

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith('--')) acc.push([arg.slice(2), arr[i + 1]])
    return acc
  }, []),
)
const APPS = Number(args.apps ?? 10)
const MODELS = Number(args.models ?? 300)
let seed = Number(args.seed ?? 1)

function rand() {
  // mulberry32
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const randInt = (n) => Math.floor(rand() * n)
const pick = (arr) => arr[randInt(arr.length)]

const APP_WORDS = ['accounts', 'billing', 'catalog', 'crm', 'events', 'forum', 'geo', 'hr',
  'inventory', 'jobs', 'kyc', 'logistics', 'media', 'news', 'orders', 'payments', 'quota',
  'reports', 'search', 'tags', 'users', 'vendors', 'wiki', 'xport', 'yields', 'zones']
const NOUNS = ['User', 'Profile', 'Order', 'Item', 'Invoice', 'Payment', 'Address', 'Product',
  'Category', 'Tag', 'Comment', 'Post', 'Thread', 'Message', 'Event', 'Ticket', 'Session',
  'Token', 'Group', 'Role', 'Permission', 'Audit', 'Log', 'Report', 'Job', 'Task', 'Batch',
  'Shipment', 'Warehouse', 'Stock', 'Price', 'Discount', 'Coupon', 'Review', 'Rating',
  'Subscription', 'Plan', 'Feature', 'Account', 'Contact']
const FIELD_TYPES = ['CharField', 'TextField', 'IntegerField', 'DateTimeField', 'BooleanField',
  'DecimalField', 'UUIDField', 'JSONField', 'SlugField', 'EmailField']
const FIELD_NAMES = ['name', 'title', 'slug', 'status', 'kind', 'amount', 'quantity', 'note',
  'created_at', 'updated_at', 'is_active', 'priority', 'external_id', 'meta', 'description']

const FONT = 'FACE="Helvetica"'

function fieldRow(name, type, { bold = false, gray = false, italic = false } = {}) {
  const wrap = (s) => {
    if (bold) s = `<B>${s}</B>`
    if (italic) s = `<I>${s}</I>`
    const color = gray ? ' COLOR="#7B7B7B"' : ''
    return `<FONT ${FONT}${color}>${s}</FONT>`
  }
  return `<TR><TD ALIGN="LEFT" BORDER="0">${wrap(name)}</TD><TD ALIGN="LEFT">${wrap(type)}</TD></TR>`
}

function nodeLabel(modelName, fields) {
  const header =
    `<TR><TD COLSPAN="2" CELLPADDING="4" ALIGN="CENTER" BGCOLOR="#1b563f">` +
    `<FONT FACE="Helvetica Bold" COLOR="white">${modelName}</FONT></TD></TR>`
  return (
    `<TABLE BGCOLOR="white" BORDER="0" CELLBORDER="0" CELLSPACING="0">` +
    header + fields.join('') + `</TABLE>`
  )
}

const EDGE_ATTRS = {
  fk: '[arrowhead=none, arrowtail=dot, dir=both]',
  m2m: '[arrowhead=dot arrowtail=dot, dir=both]',
  o2o: '[arrowhead=none, arrowtail=none, dir=both]',
  generic: '[style="dotted", arrowhead=normal, arrowtail=normal]',
  inheritance: '[arrowhead=empty, arrowtail=none, dir=both]',
}

// --- build model set ---
const apps = Array.from({ length: APPS }, (_, i) => {
  const base = APP_WORDS[i % APP_WORDS.length]
  return i < APP_WORDS.length ? base : `${base}${Math.floor(i / APP_WORDS.length) + 1}`
})

const models = []
const usedNames = new Set()
for (let i = 0; i < MODELS; i++) {
  const app = apps[randInt(apps.length)]
  let name = pick(NOUNS)
  while (usedNames.has(`${app}_${name}`)) name = `${pick(NOUNS)}${randInt(999)}`
  usedNames.add(`${app}_${name}`)
  const nFields = 3 + randInt(13)
  const fields = [fieldRow('id', 'AutoField', { bold: true })]
  for (let f = 1; f < nFields; f++) {
    fields.push(
      fieldRow(`${pick(FIELD_NAMES)}_${f}`, pick(FIELD_TYPES), {
        gray: rand() < 0.2,
        italic: rand() < 0.1,
      }),
    )
  }
  models.push({ app, name, id: `${app}_models_${name}`, fields })
}

// --- edges: preferential attachment so hubs emerge ---
const edges = []
const degree = new Array(models.length).fill(1)
const totalEdges = Math.floor(MODELS * 1.8)
function pickTarget() {
  // roulette wheel over degree
  let total = 0
  for (const d of degree) total += d
  let r = rand() * total
  for (let i = 0; i < degree.length; i++) {
    r -= degree[i]
    if (r <= 0) return i
  }
  return degree.length - 1
}
for (let e = 0; e < totalEdges; e++) {
  const a = randInt(models.length)
  let b = pickTarget()
  if (a === b) b = (b + 1) % models.length
  const r = rand()
  const kind = r < 0.7 ? 'fk' : r < 0.85 ? 'm2m' : r < 0.95 ? 'inheritance' : 'generic'
  degree[a]++
  degree[b]++
  const label =
    kind === 'inheritance'
      ? `${pick(['abstract', 'multi-table', 'proxy'])}\\ninheritance`
      : ` ${pick(FIELD_NAMES)}`
  // FK relations also get a bold relation row in the source model
  if (kind === 'fk')
    models[a].fields.push(fieldRow(label.trim(), `ForeignKey (${models[b].name})`, { bold: true }))
  edges.push({ from: models[a].id, to: models[b].id, kind, label })
  // ~5% parallel-edge pairs
  if (rand() < 0.05 && kind === 'fk') {
    edges.push({ from: models[a].id, to: models[b].id, kind, label: ` ${pick(FIELD_NAMES)}_alt` })
  }
}

// --- emit dot ---
const out = []
out.push('digraph model_graph {')
out.push('  fontname = "Helvetica"')
out.push('  fontsize = 8')
out.push('  splines  = true')
out.push('  rankdir = "TB"')
out.push('  node [fontname="Helvetica", fontsize=8, shape="plaintext"]')
out.push('  edge [fontname="Helvetica", fontsize=8]')

for (const app of apps) {
  const appModels = models.filter((m) => m.app === app)
  if (appModels.length === 0) continue
  out.push(`  subgraph cluster_${app}_models {`)
  out.push(`    label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0"><TR><TD COLSPAN="2" CELLPADDING="4" ALIGN="CENTER"><FONT FACE="Helvetica Bold" COLOR="Black" POINT-SIZE="12"><B>${app}</B></FONT></TD></TR></TABLE>>`)
  out.push(`    color=olivedrab4`)
  out.push(`    style="rounded"`)
  for (const m of appModels) {
    out.push(`    ${m.id} [label=<${nodeLabel(m.name, m.fields)}>]`)
  }
  out.push('  }')
}

// graph_models needs_node quirk: stub re-declarations of some edge targets
const stubbed = new Set()
for (const e of edges) {
  if (rand() < 0.03 && !stubbed.has(e.to)) {
    stubbed.add(e.to)
    const m = models.find((mm) => mm.id === e.to)
    out.push(`  ${m.id} [label=<${nodeLabel(m.name, [])}>]`)
  }
}

for (const e of edges) {
  out.push(`  ${e.from} -> ${e.to} [label="${e.label}"] ${EDGE_ATTRS[e.kind]};`)
}
out.push('}')

process.stdout.write(out.join('\n') + '\n')
