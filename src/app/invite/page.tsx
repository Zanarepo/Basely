import { redirect } from 'next/navigation'
import { InviteError } from '@/components/InviteError'

type InvitePageProps = {
  searchParams: Promise<{ token?: string; next?: string }>
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token, next } = await searchParams

  if (!token?.trim()) {
    return <InviteError message="This invitation link is missing a token." />
  }

  let redirectUrl = `/invite/accept?token=${encodeURIComponent(token)}`
  if (next) {
    redirectUrl += `&next=${encodeURIComponent(next)}`
  }

  redirect(redirectUrl)
}