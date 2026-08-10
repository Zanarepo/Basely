import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Baseline',
  description: 'Terms of Service for using Baseline',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-app-bg text-app-fg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-app-surface border border-app-border rounded-2xl shadow-sm p-8 sm:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-app-fg mb-4">Terms of Service</h1>
          <p className="text-app-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="space-y-8 text-app-subtle">
          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Baseline platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">2. Description of Service</h2>
            <p>
              Baseline provides project management and planning software. Our service includes integrations with third-party providers like Google to facilitate calendar synchronization and file management. 
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">3. Privacy and Data Usage</h2>
            <p>
              Your privacy is important to us. Our data collection and usage practices, including how we handle data received from Google APIs, are described in our <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</Link>. By using Baseline, you consent to our privacy practices as outlined in that document.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">4. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to use Baseline for any unlawful purpose or in any way that interrupts or damages our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">5. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Baseline at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">6. Changes to Terms</h2>
            <p>
              We may modify these Terms of Service at any time. We will provide notice of significant changes by updating the date at the top of this page. Your continued use of Baseline following any changes indicates your acceptance of the new terms.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-app-border text-center">
          <Link href="/" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
            &larr; Return to Baseline
          </Link>
        </div>
      </div>
    </div>
  )
}
