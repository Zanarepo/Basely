export type RagStatus = 'Red' | 'Amber' | 'Green'

export interface RagInput {
  cpi: number | null
  spi: number | null
  criticalPathSlippageDays: number
}

/**
 * Calculates the overall project RAG (Red/Amber/Green) status based on standard thresholds.
 * Thresholds (from PRD Open Questions):
 * - Red: CPI < 0.90 OR SPI < 0.90 OR Critical Path slippage > 10 days
 * - Amber: CPI between 0.90 and 0.95 OR SPI between 0.90 and 0.95 OR Critical Path slippage between 1 and 10 days
 * - Green: CPI >= 0.95 AND SPI >= 0.95 AND Critical Path slippage = 0
 */
export function calculateProjectRagStatus(input: RagInput): RagStatus {
  const cpi = input.cpi ?? 1.0
  const spi = input.spi ?? 1.0
  const slippage = input.criticalPathSlippageDays

  if (cpi < 0.90 || spi < 0.90 || slippage > 10) {
    return 'Red'
  }
  
  if (
    (cpi >= 0.90 && cpi < 0.95) ||
    (spi >= 0.90 && spi < 0.95) ||
    (slippage >= 1 && slippage <= 10)
  ) {
    return 'Amber'
  }
  
  return 'Green'
}
