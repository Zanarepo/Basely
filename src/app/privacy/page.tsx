import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Prazaner',
  description: 'Privacy Policy and Google API Data Usage for Prazaner',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-app-bg text-app-fg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-app-surface border border-app-border rounded-2xl shadow-sm p-8 sm:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-app-fg mb-4">Privacy Policy</h1>
          <p className="text-app-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="space-y-8 text-app-subtle">
          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">1. Introduction</h2>
            <p>
              Welcome to Prazaner. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, store, and share your data when you use the Prazaner platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">2. Google API Data Access and Usage</h2>
            <p className="mb-3">
              Prazaner integrates with Google Services to enhance your project management experience. We specifically request access to your Google Calendar and Google Drive.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Google Calendar:</strong> We access your Calendar to sync Prazaner project tasks directly to your phone and calendar apps. This enables you to receive fast notifications, deadlines, and reminders exactly where you need them.
              </li>
              <li>
                <strong>Google Drive:</strong> We access your Drive to allow you to easily browse, attach, and access your project files and documents directly within the Prazaner platform, keeping your workflow unified.
              </li>
            </ul>
            <p className="font-semibold text-app-fg p-4 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
              Google API Services User Data Policy Compliance:<br/>
              <span className="font-normal text-app-subtle">
                Prazaner's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">3. Data Sharing and Disclosure</h2>
            <p>
              <strong>We do not sell your personal data or Google user data to any third parties.</strong> Data retrieved from Google APIs is used strictly to provide the calendar syncing and file attachment features within the Prazaner platform. We do not use your Google data for serving advertisements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">4. Data Retention and Deletion</h2>
            <p>
              You have the right to request the deletion of your account and associated data at any time. 
              Upon submitting a data deletion request, your data will enter a 30-day grace period. After this 30-day period expires, your data (including any cached Google API data) will be <strong>permanently and irreversibly deleted</strong> from our servers. 
              You can also revoke Prazaner's access to your Google account at any time via your Google Account Security settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-app-fg mb-3">5. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption at rest and in transit. Access to sensitive data is strictly governed by our internal access control policies.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-app-border text-center">
          <Link href="/" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
            &larr; Return to Prazaner
          </Link>
        </div>
      </div>
    </div>
  )
}
