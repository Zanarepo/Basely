import type { Metadata } from 'next'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Choose New Password | Basely',
  description: 'Enter a new password for your Basely account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
