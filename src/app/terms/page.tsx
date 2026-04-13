import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';

export default function TermsAndConditionsPage() {
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
            <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last Updated: {format(lastUpdated, 'MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>Welcome to DEFIMART. These terms and conditions outline the rules and regulations for the use of our platform. By accessing this website, we assume you accept these terms and conditions. Do not continue to use DEFIMART if you do not agree to all of the terms and conditions stated on this page.</p>
            
            <Section title="1. Accounts">
              <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
              <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
            </Section>

            <Section title="2. Orders and Payment">
              <p>DEFIMART operates on a payment-on-pickup basis. No online payments are processed through our platform. By placing an order, you agree to pay the total amount in person at the time of pickup.</p>
              <p>An order confirmation from us does not signify our acceptance of your order, nor does it constitute confirmation of our offer to sell. We reserve the right at any time after receipt of your order to accept or decline your order for any reason.</p>
            </Section>

            <Section title="3. Pickup Policy">
              <p>Orders must be picked up according to the specified pickup schedule (Wednesdays and Saturdays). It is your responsibility to collect your items on the designated day. Failure to pick up an order may result in the suspension of your account.</p>
            </Section>

            <Section title="4. User Conduct">
              <p>You agree not to use the platform for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the platform in any way that could damage the platform, the services, or the general business of DEFIMART.</p>
            </Section>

            <Section title="5. Limitation of Liability">
              <p>In no event shall DEFIMART, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            </Section>

            <Section title="6. Changes to Terms">
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
            </Section>

             <Section title="7. Contact Us">
              <p>If you have any questions about these Terms, please contact us through the information provided on our Contact page.</p>
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
