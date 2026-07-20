import { formatCurrency } from '@/lib/utils'

type CurrencyDisplayProps = {
  amount: number | null | undefined
  currency: string | null | undefined
  /** The amount at which to start abbreviating (e.g., 100000). Defaults to 10000. */
  compactThreshold?: number
  className?: string
}

export function CurrencyDisplay({ 
  amount, 
  currency, 
  compactThreshold = 10000, 
  className 
}: CurrencyDisplayProps) {
  if (amount == null || !currency) {
    return <span className={className}>—</span>
  }

  const isLarge = Math.abs(amount) >= compactThreshold

  const displayValue = isLarge 
    ? formatCurrency(amount, currency, { notation: 'compact', maximumFractionDigits: 2 })
    : formatCurrency(amount, currency)

  return (
    <span 
      className={className} 
      title={isLarge ? formatCurrency(amount, currency) : undefined}
    >
      {displayValue}
    </span>
  )
}
