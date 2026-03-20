import { Header } from '@/components/header';

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Help Center</h1>
        <div className="text-center text-muted-foreground">
            How can we help you today?
        </div>
      </main>
    </div>
  );
}
