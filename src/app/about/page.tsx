import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Eye, Users, Store, ShieldCheck } from 'lucide-react';

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-2xl">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h3 className="text-xl font-bold mb-1 uppercase tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">{children}</p>
        </div>
    </div>
);


export default function AboutPage() {
  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden">
           <div className="bg-primary p-8 md:p-12 text-white text-center">
             <CardHeader className="p-0">
                <CardTitle className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">About DEFIMART</CardTitle>
                <CardDescription className="text-white/80 text-lg mt-2 font-bold uppercase tracking-widest">
                   The Campus Marketplace Protocol
                </CardDescription>
              </CardHeader>
           </div>
          <CardContent className="space-y-10 p-8 md:p-12">
            
            <div className="bg-primary/5 border-2 border-dashed border-primary/20 p-8 rounded-[32px] text-center">
                 <p className="text-lg md:text-xl font-bold text-foreground leading-relaxed">
                    DEFIMART is a high-performance marketplace designed exclusively for the university community. We bridge the gap between official campus retail and the vibrant world of student entrepreneurship.
                </p>
            </div>

            <div className="grid gap-12">
                <Section title="Our Mission" icon={Target}>
                    To provide a decentralized, professional platform that facilitates seamless on-campus commerce. We empower student entrepreneurs by giving them the tools to run digital storefronts while providing students with convenient access to verified products.
                </Section>

                <Section title="The Hybrid Marketplace" icon={Store}>
                    Unlike traditional stores, DEFIMART operates as a hybrid hub. We manage an official platform inventory of campus essentials while hosting a network of independent, student-owned "Vendor Shops." This dual-layer approach ensures a massive variety of goods tailored to student needs.
                </Section>

                <Section title="Secure Campus Logic" icon={ShieldCheck}>
                    Security is our core protocol. By utilizing a "Pay on Collection" system, we eliminate digital transaction risks. Students can inspect their items at designated pickup points or hall delivery zones before finalizing any payment, fostering a culture of trust and reliability.
                </Section>
                
                 <Section title="Our Vision" icon={Eye}>
                    To become the central commercial operating system for every university campus, fostering a vibrant and self-sustaining student economy built on innovation, convenience, and community support.
                </Section>
            </div>

            <Separator className="opacity-50" />

             <div className="text-center space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[4px] text-muted-foreground">The Team</h3>
                <p className="text-muted-foreground font-medium italic">
                    "We are a passionate team of student developers and entrepreneurs who believe in the power of technology to solve real-world campus problems. DEFIMART was built by students, for students."
                </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
