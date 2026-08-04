'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export function TenantSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [value, setValue] = useState(defaultValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Prevent triggering on the initial render if the value matches the defaultValue from URL
    if (value === defaultValue && !timeoutRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [value, router, pathname, searchParams, defaultValue])

  return (
    <input 
      type="search" 
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search organizations..." 
      className="px-4 py-2 bg-app-input border border-app-border rounded-xl text-sm text-app-fg placeholder-app-subtle focus:outline-none focus:ring-2 focus:ring-app-orb-indigo w-64"
    />
  )
}
