import { Header } from '@/components/header';

export default function MessagesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        <div className="text-center text-muted-foreground">
            You have no messages.
        </div>
      </main>
    </div>
  );
}
