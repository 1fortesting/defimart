import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date(2026, 6, 26);

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-3">
      <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">{title}</h2>
      <div className="text-muted-foreground space-y-3 text-sm md:text-base leading-relaxed font-medium">{children}</div>
    </div>
  );

  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-none shadow-xl rounded-[32px]">
          <CardHeader className="border-b bg-muted/5 p-8">
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Privacy Protocol</CardTitle>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Last Protocol Sync: {format(lastUpdated, 'MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-10">
            <p className="font-bold text-foreground leading-relaxed">DEFIMART ("the Platform") respects the data sovereignty of its campus users. This policy outlines how we handle information in a multi-vendor marketplace environment.</p>
            
            <Section title="1. Marketplace Data Collection">
              <p>We collect essential data to facilitate campus trade. This includes:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Identity:</strong> Email address, Full name, and Profile images.</li>
                <li><strong>Communication:</strong> Your phone number is required to send order updates and coordinate pickups.</li>
                <li><strong>Marketplace Activity:</strong> We store your order history, wishlist items, and reviews to personalize your experience.</li>
              </ul>
            </Section>

            <Section title="2. Buyer-Vendor Information Sharing">
              <p><strong>CRITICAL:</strong> When you place an order with an <strong>Independent Student Vendor</strong>, we share your display name, phone number, and delivery location with that vendor. This is necessary for the vendor to verify your order and coordinate the physical collection/delivery on campus.</p>
              <p>Vendors are prohibited from using this information for any purpose other than order fulfillment. DEFIMART does not share your email address with independent vendors.</p>
            </Section>

            <Section title="3. SMS & Notification Infrastructure">
              <p>We use your phone number to deliver order-critical updates. This includes SMS notifications when an order is "Ready for Pickup" or when a vendor has accepted your delivery request. By using the platform, you consent to receive these transactional messages.</p>
            </Section>

            <Section title="4. Data Sovereignty and Security">
              <p>Your data is stored in a secure cloud environment. We do not sell, rent, or lease your personal information to third-party marketing firms. Your information is used strictly within the campus ecosystem to improve DEFIMART's service and security.</p>
            </Section>

            <Section title="5. User-Generated Content">
              <p>Reviews, comments on feeds, and public shop ratings are visible to other users of the platform. Please exercise discretion when sharing personal details in these public fields.</p>
            </Section>

            <Section title="6. Protocol Rights">
              <p>You have the right to access, modify, or delete your account data. You can update your profile details in the settings at any time. For full account deletion, please contact our support team.</p>
            </Section>

            <Section title="7. Contact">
              <p>Questions regarding data protocols should be directed to our <Link href="/contact" className="text-primary underline font-bold">Support Team</Link>.</p>
            </Section>
          </CardContent>
          <CardFooter className="bg-muted/5 p-6 rounded-b-[32px]">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mx-auto text-center">
                &copy; {new Date().getFullYear()} DEFIMART DATA SECURITY PROTOCOL.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
