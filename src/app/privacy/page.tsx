import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date(2024, 6, 26); // July 26, 2024

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-muted-foreground space-y-3">{children}</div>
    </div>
  );

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last Updated: {format(lastUpdated, 'MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>DEFIMART ("us", "we", or "our") operates the DEFIMART website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
            
            <Section title="1. Information Collection and Use">
              <p>We collect several different types of information for various purposes to provide and improve our Service to you. This includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This includes, but is not limited to: Email address, Full name, and Phone number.</li>
                <li><strong>User-Generated Content:</strong> We collect information you provide when you write reviews or save products to your wishlist.</li>
                <li><strong>Order Information:</strong> We store details about your orders, including the products purchased and any notes you provide.</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use the collected data for various purposes:</p>
               <ul className="list-disc list-inside space-y-1">
                <li>To provide and maintain our Service.</li>
                <li>To manage your account and process your orders.</li>
                <li>To notify you about the status of your order, including sending SMS notifications for order confirmations and readiness for pickup.</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
                <li>To provide customer support.</li>
              </ul>
            </Section>

            <Section title="3. Data Storage and Third Parties">
              <p>Your data is securely stored and managed by our trusted backend service provider. We do not sell or rent your personal data to third parties.</p>
              <p>For SMS notifications, we use a third-party messaging service. Your phone number and order details are shared with this service solely for the purpose of sending you order-related updates.</p>
            </Section>

            <Section title="4. Data Security">
              <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
            </Section>

            <Section title="5. Your Rights">
              <p>You have the right to access, update, or delete the information we have on you. You can update your profile information directly within your account settings. If you wish to delete your account, please contact us.</p>
            </Section>

            <Section title="6. Contact Us">
              <p>If you have any questions about this Privacy Policy, please <Link href="/contact" className="text-primary underline">contact us</Link>.</p>
            </Section>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground mx-auto">
                &copy; {new Date().getFullYear()} DEFIMART. All Rights Reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
