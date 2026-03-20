import { Header } from '@/components/header';

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="text-center text-muted-foreground">
            Your cart is currently empty.
        </div>
      </main>
    </div>
  );
}
