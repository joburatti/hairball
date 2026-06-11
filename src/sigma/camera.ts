import type Sigma from 'sigma'

let activeSigma: Sigma | null = null

export function setActiveSigma(sigma: Sigma | null): void {
  activeSigma = sigma
}

export function getActiveSigma(): Sigma | null {
  return activeSigma
}

/** Animate the camera to a node (used by search + relation list). */
export function flyToNode(node: string): void {
  if (!activeSigma) return
  const data = activeSigma.getNodeDisplayData(node)
  if (!data) return
  activeSigma.getCamera().animate({ x: data.x, y: data.y, ratio: 0.25 }, { duration: 600 })
}

export function fitView(): void {
  activeSigma?.getCamera().animatedReset({ duration: 400 })
}
