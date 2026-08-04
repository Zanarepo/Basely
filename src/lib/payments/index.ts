import { PaymentGatewayAdapter } from './types'
import { PaystackAdapter } from './paystack-adapter'

let paystackInstance: PaymentGatewayAdapter | null = null
let stripeInstance: PaymentGatewayAdapter | null = null

export function getPrioritizedGateways(countryCode: string): PaymentGatewayAdapter[] {
  const gateways: PaymentGatewayAdapter[] = []

  // Initialize Paystack if configured
  if (process.env.PAYSTACK_SECRET_KEY && !paystackInstance) {
    paystackInstance = new PaystackAdapter()
  }

  // Determine if Stripe is configured (mock check for now, you'd check STRIPE_SECRET_KEY)
  const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY

  if (isStripeConfigured && !stripeInstance) {
    // stripeInstance = new StripeAdapter() 
    // We will uncomment this once StripeAdapter is fully built
  }

  // Routing Logic
  // If user is in US/EU/UK and Stripe is configured, prioritize Stripe.
  const isWesternRegion = ['US', 'GB', 'EU', 'CA', 'AU'].includes(countryCode.toUpperCase())

  if (isWesternRegion && isStripeConfigured && stripeInstance) {
    gateways.push(stripeInstance)
    if (paystackInstance) gateways.push(paystackInstance) // Fallback to Paystack
  } else {
    // If African region, OR if Stripe is simply not configured yet, prioritize Paystack.
    if (paystackInstance) gateways.push(paystackInstance)
    if (isStripeConfigured && stripeInstance) gateways.push(stripeInstance) // Fallback to Stripe
  }

  // If literally nothing is configured, ensure we don't crash
  if (gateways.length === 0 && !process.env.PAYSTACK_SECRET_KEY) {
    // As a strict fallback for development if envs are missing
    gateways.push(new PaystackAdapter()) 
  }

  return gateways
}
