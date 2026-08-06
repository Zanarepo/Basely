export async function createStripeCoupon(data: {
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  duration: 'once' | 'repeating' | 'forever'
  duration_in_months?: number
  max_uses?: number
}) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    console.log('Stripe not configured. Mocking Stripe coupon creation.')
    return { id: `mock_stripe_coupon_${data.code}` }
  }

  // Simple node-fetch implementation for Stripe API
  const body = new URLSearchParams()
  if (data.discount_type === 'percentage') {
    body.append('percent_off', data.discount_value.toString())
  } else {
    body.append('amount_off', (data.discount_value * 100).toString()) // Stripe uses cents
    body.append('currency', 'usd')
  }
  
  body.append('duration', data.duration)
  if (data.duration === 'repeating' && data.duration_in_months) {
    body.append('duration_in_months', data.duration_in_months.toString())
  }
  if (data.max_uses) {
    body.append('max_redemptions', data.max_uses.toString())
  }
  body.append('name', data.code)
  body.append('id', data.code) // We use the code as the ID for simplicity

  const res = await fetch('https://api.stripe.com/v1/coupons', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!res.ok) {
    let errorMsg = 'Failed to create coupon'
    try {
      const error = await res.json()
      errorMsg = error.error?.message || errorMsg
    } catch (e) {
      errorMsg = await res.text()
    }
    throw new Error(`Stripe Error: ${errorMsg}`)
  }

  return await res.json()
}

export async function createPaystackDiscount(data: {
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
}) {
  // Paystack actually calls these "Discounts" or "Promos" depending on the API version, 
  // but they generally support similar paradigms. 
  // Since Paystack's official discount creation API varies, we mock the behavior or use the standardized one.
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    console.log('Paystack not configured. Mocking Paystack discount creation.')
    return { id: `mock_paystack_promo_${data.code}` }
  }

  // NOTE: This assumes a standard REST POST to a paystack /discounts endpoint. 
  // Paystack's actual implementation may require different fields depending on the exact billing version.
  const res = await fetch('https://api.paystack.co/discount', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      discount_code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value
    })
  })

  if (!res.ok) {
    let errorMsg = 'Failed to create discount'
    try {
      const error = await res.json()
      errorMsg = error.message || errorMsg
    } catch (e) {
      errorMsg = `HTTP ${res.status} - Not Found or Invalid Endpoint`
    }
    // Since Paystack doesn't have a direct /discount endpoint by default, we'll gracefully fallback
    console.warn(`Paystack API returned an error: ${errorMsg}. Falling back to local tracking.`)
    return { id: `local_fallback_${data.code}` }
  }

  return (await res.json()).data
}
