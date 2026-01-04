import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Snack',
  description: 'Terms and conditions for using Snack, a product by Rat Labs LLC.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 md:py-12 max-w-[800px] px-4 md:px-0">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 1, 2026</p>
        </div>

        <div className="space-y-8">
          <p className="text-foreground">
            Welcome to <strong>Snack</strong>, a product by <strong>Rat Labs LLC</strong>, a Delaware company (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). Snack helps you curate, organize, and share your favorite links as visual lists. By using Snack (the &quot;Service&quot;), you agree to these Terms. Please read them carefully.
          </p>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">1. Who can use Snack</h2>
            <p className="text-foreground">
              You must be at least <strong>13 years old</strong> to use Snack. If you&apos;re under 18, you should only use Snack with permission from a parent or guardian.
            </p>
            <p className="text-foreground">
              By using Snack, you confirm that you have the legal right and capacity to enter into this agreement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">2. Your account</h2>
            <p className="text-foreground">
              You can create an account to manage your lists and preferences. You&apos;re responsible for any activity that happens under your account.
            </p>
            <p className="text-foreground">
              You can delete your account at any time, and we&apos;ll permanently remove your lists and personal data. However, if your account or lists are accidentally deleted or lost for any reason, <strong>Rat Labs LLC is not responsible for recovering them or any resulting loss</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3. Using Snack</h2>
            <p className="text-foreground">
              Snack is designed for curating and sharing links. You agree to use it only for lawful purposes and in a way that doesn&apos;t harm the platform or other users.
            </p>
            <p className="text-foreground">You may not:</p>
            <ul className="list-disc pl-6 space-y-1 text-foreground">
              <li>Use Snack to post or share illegal, spammy, or NSFW content</li>
              <li>Abuse, exploit, or disrupt the Service</li>
              <li>Violate the rights of others or share content you don&apos;t have permission to share</li>
            </ul>
            <p className="text-foreground">
              We reserve the right to remove any lists or content that violate these Terms or that we believe may harm the platform or community.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">4. Payments and earnings</h2>
            <p className="text-foreground">
              Snack is currently free to use. In the future, you&apos;ll be able to sell access to your lists (&quot;Paid Lists&quot;).
            </p>
            <p className="text-foreground">When you sell a Paid List:</p>
            <ul className="list-disc pl-6 space-y-1 text-foreground">
              <li>All payments are processed securely through <strong>Stripe Connect</strong>.</li>
              <li><strong>Snack takes a 20% platform fee</strong> (for example, on a $5 sale, you receive $4 and Snack keeps $1).</li>
              <li>Payments are final — we generally <strong>don&apos;t offer refunds</strong>, but you can contact <Link href="mailto:hi@snack.xyz" className="text-primary hover:underline">hi@snack.xyz</Link> for special requests.</li>
            </ul>
            <p className="text-foreground">
              You are responsible for any taxes or reporting obligations that come from earning revenue on Snack.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">5. Content ownership and responsibility</h2>
            <p className="text-foreground">
              Snack helps you <strong>curate</strong> content, but we don&apos;t claim ownership of what you create. You keep rights to your lists and content.
            </p>
            <p className="text-foreground">
              By adding content or links, you grant Rat Labs LLC a limited license to display and share your lists as part of operating the platform.
            </p>
            <p className="text-foreground">
              You&apos;re responsible for ensuring that you have the right to share any links, media, or materials you include in your lists. Snack isn&apos;t liable if a user shares confidential, copyrighted, or restricted material without permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">6. Termination</h2>
            <p className="text-foreground">
              We reserve the right to <strong>suspend or terminate your account</strong> at any time, with or without notice, if you violate these Terms, misuse the Service, or engage in activity that may harm Snack or its community.
            </p>
            <p className="text-foreground">
              You may also delete your account at any time. Upon termination, you will lose access to your account and any associated data or lists.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">7. Service changes</h2>
            <p className="text-foreground">
              Snack is an evolving product. We may update, change, or remove features at any time. We may also suspend or end access to accounts that violate these Terms or misuse the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">8. No warranty and limited liability</h2>
            <p className="text-foreground">
              Snack is provided <strong>&quot;as is&quot; and &quot;as available.&quot;</strong> We make no guarantees about uptime, reliability, or content accuracy. We do not warrant that the Service will always be uninterrupted, secure, or error-free, and we don&apos;t verify or endorse any third-party content shared through Snack.
            </p>
            <p className="text-foreground">
              To the fullest extent permitted by law, <strong>Rat Labs LLC is not liable for any loss, damage, or claim arising from your use of Snack</strong>, including data loss, account deletion, payment issues, or problems caused by third-party links or services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">9. Governing law</h2>
            <p className="text-foreground">
              These Terms are governed by the laws of the <strong>United States</strong> and the <strong>State of Delaware</strong>, without regard to conflict-of-law rules.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">10. Contact us</h2>
            <p className="text-foreground">
              If you have questions, reach out anytime at{' '}
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
