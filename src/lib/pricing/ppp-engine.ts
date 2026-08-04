/**
 * Purchasing Power Parity (PPP) Pricing Engine
 */

export type CurrencyCode = 'USD' | 'NGN' | 'GBP' | 'EUR' | 'ZAR' | 'KES' | 'GHS'

export interface RegionalPricing {
  countryCode: string
  currency: CurrencyCode
  discountMultiplier: number // 1.0 = no discount (US standard), 0.4 = 60% off
  exchangeRateToUsd: number  // e.g. 1500 for NGN means 1 USD = 1500 NGN
}

// Simplified matrix. In a production app, you might fetch exchange rates dynamically.
const PPP_MATRIX: Record<string, RegionalPricing> = {
  US: { countryCode: 'US', currency: 'USD', discountMultiplier: 1.0, exchangeRateToUsd: 1 },
  UK: { countryCode: 'GB', currency: 'GBP', discountMultiplier: 1.0, exchangeRateToUsd: 0.78 },
  EU: { countryCode: 'EU', currency: 'EUR', discountMultiplier: 1.0, exchangeRateToUsd: 0.92 },
  
  // High-discount regions
  NG: { countryCode: 'NG', currency: 'NGN', discountMultiplier: 0.4, exchangeRateToUsd: 1500 },
  IN: { countryCode: 'IN', currency: 'USD', discountMultiplier: 0.3, exchangeRateToUsd: 1 }, // Often billed in USD with discount
  ZA: { countryCode: 'ZA', currency: 'ZAR', discountMultiplier: 0.5, exchangeRateToUsd: 18.5 },
  KE: { countryCode: 'KE', currency: 'KES', discountMultiplier: 0.4, exchangeRateToUsd: 130 },
  GH: { countryCode: 'GH', currency: 'GHS', discountMultiplier: 0.4, exchangeRateToUsd: 15 },
}

const DEFAULT_REGION: RegionalPricing = PPP_MATRIX['US']

/**
 * Calculates the localized price based on base USD price and country code.
 * @param baseUsdPrice Base price in USD (e.g. 25 for Premium)
 * @param countryCode 2-letter ISO country code (e.g. 'NG')
 * @returns localized price object
 */
export function calculatePppPrice(baseUsdPrice: number, countryCode: string) {
  const region = PPP_MATRIX[countryCode.toUpperCase()] || DEFAULT_REGION

  // 1. Apply PPP discount to the USD price
  const discountedUsd = baseUsdPrice * region.discountMultiplier

  // 2. Convert to local currency
  const localizedAmount = discountedUsd * region.exchangeRateToUsd

  // 3. Format the amount nicely (e.g. round NGN to nearest 100, USD to nearest 0.01)
  let finalAmount = localizedAmount
  if (region.currency === 'NGN') {
    finalAmount = Math.ceil(localizedAmount / 100) * 100
  } else if (region.currency === 'USD' || region.currency === 'GBP' || region.currency === 'EUR') {
    finalAmount = Math.round(localizedAmount * 100) / 100
  } else {
    finalAmount = Math.ceil(localizedAmount)
  }

  return {
    originalUsdPrice: baseUsdPrice,
    discountedUsd,
    finalAmount,
    currency: region.currency,
    countryCode: region.countryCode,
    discountPercentage: Math.round((1 - region.discountMultiplier) * 100),
  }
}

/**
 * Formats a currency amount into a readable string
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  try {
    const locale = currency === 'NGN' ? 'en-NG' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'NGN' ? 0 : 2
    }).format(amount)
  } catch (e) {
    // Fallback if Intl fails
    return `${currency === 'NGN' ? '₦' : currency + ' '}${amount}`
  }
}
