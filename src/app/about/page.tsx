import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Target, Eye, Users, Code } from 'lucide-react';

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="bg-muted p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h3 className="text-xl font-semibold mb-1">{title}</h3>
            <p className="text-muted-foreground">{children}</p>
        </div>
    </div>
);


export default function AboutPage() {
  return (
    <main className="flex-1 p-4 md:p-8 bg-muted/20">
      <div className="container mx-auto max-w-3xl">
        <Card>
           <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold">About DEFIMART</CardTitle>
            <CardDescription className="text-lg mt-2">
               Connecting the campus, one trade at a time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6 md:p-8">
            
            <div className="bg-accent/20 border border-primary/20 p-6 rounded-lg text-center">
                 <p className="text-lg font-semibold text-foreground">
                    DEFIMART is a student-centric online marketplace designed exclusively for the university community. Our platform empowers students to buy and sell goods safely and conveniently on campus through a secure, pickup-based transaction system.
                </p>
            </div>

            <Section title="Our Mission" icon={Target}>
                To provide a reliable and user-friendly platform that facilitates seamless on-campus commerce, empowering student entrepreneurs and providing convenient access to goods and services for the entire student body.
            </Section>

            <Section title="Our Vision" icon={Eye}>
                To become the central digital marketplace for every university campus, fostering a vibrant and self-sustaining student economy built on trust, convenience, and innovation.
            </Section>
            
             <Section title="Our Team" icon={Users}>
                We are a passionate team of student developers and entrepreneurs who believe in the power of technology to solve real-world problems. We built DEFIMART to address the unique commercial needs of our campus community.
            </Section>

          </CardContent>
        </Card>
      </div>
    </main>
  );
}
