import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
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
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Terms of Service</CardTitle>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Last Protocol Update: {format(lastUpdated, 'MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-10">
            <p className="font-bold text-foreground">Welcome to DEFIMART. By accessing this marketplace, you agree to comply with the protocols outlined below. These terms govern your use of the platform as either a buyer or an independent vendor.</p>
            
            <Section title="1. Marketplace Identity">
              <p>DEFIMART is a multi-vendor platform. Users may purchase items from the <strong>DEFIMART Official Store</strong> or from <strong>Independent Student Vendors</strong>. Your contract for purchase from a student vendor is strictly between you and that specific vendor.</p>
              <p>You must provide accurate, complete, and current information when creating an account. Failure to do so constitutes a breach of protocol, which may result in account termination.</p>
            </Section>

            <Section title="2. The Pay-on-Pickup Protocol">
              <p>DEFIMART operates exclusively on a <strong>Payment on Collection</strong> basis. No online payments are processed or authorized through this platform. By placing an order, you commit to paying the full GHS valuation in person at the time of pickup or delivery.</p>
              <p>Verified student vendors may offer hall delivery. In such cases, the payment must be made to the delivery agent upon successful inspection of the product.</p>
            </Section>

            <Section title="3. Vendor & Marketplace Relations">
              <p>Independent student vendors are solely responsible for the accuracy of their product descriptions, stock levels, and delivery times. DEFIMART facilitates the introduction and ordering process but does not own or handle the inventory of independent vendor shops.</p>
              <p>DEFIMART reserves the right to suspend any vendor shop that violates our quality standards or fails to fulfill orders without valid reason.</p>
            </Section>

            <Section title="4. Order Fulfillment & Pickup Schedule">
              <p>Orders must be picked up according to the specified schedule (Wednesdays and Saturdays for platform items). Student vendors may have unique delivery windows as specified in their shop bio. It is the buyer's responsibility to coordinate collection within these windows.</p>
            </Section>

            <Section title="5. Inspection and Returns">
              <p>Since all transactions are completed in person, <strong>inspection is mandatory</strong> before payment. Once payment is made and the pickup/delivery is finalized, DEFIMART and its vendors are not liable for subsequent damages. Returns are handled on a case-by-case basis directly with the seller.</p>
            </Section>

            <Section title="6. Limitation of Liability">
              <p>DEFIMART is not liable for any indirect, incidental, or punitive damages resulting from transactions between buyers and independent student vendors. We provide the infrastructure for trade but are not party to the final physical exchange.</p>
            </Section>

            <Section title="7. Contact">
              <p>For inquiries regarding these terms, please contact the command center via our <Link href="/contact" className="text-primary underline font-bold">Contact Page</Link>.</p>
            </Section>
          </CardContent>
          <CardFooter className="bg-muted/5 p-6 rounded-b-[32px]">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] mx-auto text-center">
                &copy; {new Date().getFullYear()} DEFIMART PLATFORM PROTOCOL.
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
