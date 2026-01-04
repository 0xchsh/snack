import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Snack',
  description: 'Learn how Snack collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 md:py-12 max-w-[800px] px-4 md:px-0">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: Sept. 24, 2024</p>
        </div>

        <div className="space-y-8">
          <p className="text-foreground">
            This Privacy Policy describes how Snack (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and shares your personal information when you use our service.
          </p>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-foreground">
              <strong>1.1. Account Information:</strong> When you create an account, we collect information such as your name and email address. If you choose to sign up using Google, we may receive additional profile information from this service.
            </p>
            <p className="text-foreground">
              <strong>1.2. User Content:</strong> We collect and store the links and lists you create on Snack.
            </p>
            <p className="text-foreground">
              <strong>1.3. Usage Information:</strong> We collect information about how you use Snack, including your interactions with the service and analytics data.
            </p>
            <p className="text-foreground">
              <strong>1.4. Device Information:</strong> We may collect information about the device you use to access Snack, including the hardware model, operating system, and browser type.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-foreground">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 text-foreground">
              <li>Provide, maintain, and improve Snack</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities in connection with Snack</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Sharing of Information</h2>
            <p className="text-foreground">
              <strong>3.1.</strong> We do not sell your personal information to third parties.
            </p>
            <p className="text-foreground">
              <strong>3.2.</strong> We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-foreground">
              <li>With third-party service providers that perform services on our behalf</li>
              <li>If required by law or to respond to legal process</li>
              <li>To protect our rights, property, or safety, or that of our users or others</li>
            </ul>
            <p className="text-foreground">
              <strong>3.3.</strong> We use{' '}
              <Link href="https://supabase.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Supabase
              </Link>{' '}
              for user authentication and data storage. Please refer to{' '}
              <Link href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Supabase&apos;s privacy policy
              </Link>{' '}
              for information on how they handle your data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Data Retention and Deletion</h2>
            <p className="text-foreground">
              If you delete your account, we will delete your user data. However, some information may remain in our records to comply with legal obligations, resolve disputes, or enforce our agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-foreground">
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">6. Security</h2>
            <p className="text-foreground">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">7. Children&apos;s Privacy</h2>
            <p className="text-foreground">
              Snack does not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">8. Changes to This Privacy Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by email. Your continued use of Snack after such notification constitutes your acceptance of the new Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">9. Contact Us</h2>
            <p className="text-foreground">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <Link href="mailto:hi@snack.xyz" className="text-primary hover:underline">
                hi@snack.xyz
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
