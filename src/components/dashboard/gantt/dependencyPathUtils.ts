export type DependencyLineStyle = 'curved' | 'orthogonal'

type DependencyPathResult = {
  pathData: string
  badgeX: number
  badgeY: number
}

export function getDependencyPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  style: DependencyLineStyle
): DependencyPathResult {
  if (style === 'orthogonal') {
    // Orthogonal: Move right to a midpoint, then down/up, then right to the target
    const midX = startX + Math.max(20, (endX - startX) / 2)
    const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
    
    // Place badge halfway down the vertical segment
    const badgeX = midX
    const badgeY = (startY + endY) / 2

    return { pathData, badgeX, badgeY }
  }

  // Curved: Smooth cubic bezier curve
  const controlOffset = Math.max(30, Math.abs(endX - startX) / 2)
  const controlX1 = startX + controlOffset
  const controlX2 = endX - controlOffset
  const pathData = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`

  // Place badge exactly at the midpoint of the bezier curve
  const badgeX = (startX + 3 * controlX1 + 3 * controlX2 + endX) / 8
  const badgeY = (startY + endY) / 2

  return { pathData, badgeX, badgeY }
}
