import type { Metadata } from 'next'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Choose New Password | Prazaner',
  description: 'Enter a new password for your Prazaner account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
