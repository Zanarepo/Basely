'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, Filter } from 'lucide-react'

export function TenantFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get('q') || '')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('q', val))
    })
  }

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('tier', e.target.value))
    })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('status', e.target.value))
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
        <input
          type="text"
          placeholder="Search organizations by name or ID..."
          value={query}
          onChange={handleSearch}
          className="w-full pl-9 pr-4 py-2 bg-app-surface-solid border border-app-border rounded-xl text-sm text-app-fg placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted pointer-events-none" />
          <select
            onChange={handleTierChange}
            defaultValue={searchParams.get('tier') || ''}
            className="pl-9 pr-8 py-2 bg-app-surface-solid border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Tiers</option>
            <option value="free">Free Starter</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted pointer-events-none" />
          <select
            onChange={handleStatusChange}
            defaultValue={searchParams.get('status') || ''}
            className="pl-9 pr-8 py-2 bg-app-surface-solid border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
    </div>
  )
}
