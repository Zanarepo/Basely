export function formatCurrency(amount: number, currency: string = 'USD', options?: { notation?: 'standard' | 'scientific' | 'engineering' | 'compact', maximumFractionDigits?: number }): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency,
    currencyDisplay: 'narrowSymbol',
    ...(options || {})
  }).format(amount)
}

export function getCurrencySymbol(currency: string = 'USD'): string {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol'
  }).formatToParts(0)
  
  return parts.find(part => part.type === 'currency')?.value || '$'
}
