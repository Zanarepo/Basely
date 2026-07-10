import { InviteError } from '@/components/InviteError'

type InviteErrorPageProps = {
  searchParams: Promise<{ message?: string }>
}

export default async function InviteErrorPage({
  searchParams,
}: InviteErrorPageProps) {
  const { message } = await searchParams

  return (
    <InviteError
      message={
        message ??
        'This invitation link is invalid, expired, or has already been used.'
      }
    />
  )
}