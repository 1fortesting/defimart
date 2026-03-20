import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { logout } from './auth/actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';

const Header = ({ user }: { user: any }) => (
  <header className="bg-card border-b p-4 flex justify-between items-center">
    <div className="font-bold text-lg text-primary">
      <Link href="/">DEFIMART</Link>
    </div>
    <div className="flex items-center gap-4">
    {user ? (
        <>
          <Button variant="link" asChild>
            <Link href="/orders">My Orders</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Welcome, {user.user_metadata?.display_name || user.email}
          </span>
          <form action={logout}>
            <Button variant="outline" size="sm">
              Logout
            </Button>
          </form>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </>
      )}
    </div>
  </header>
);

const ProductCard = ({ product, user }: { product: Tables<'products'>; user: any }) => (
    <Card className="overflow-hidden">
        <CardHeader className="p-0">
            <Image
                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/600/400'}
                alt={product.name}
                width={600}
                height={400}
                className="object-cover w-full aspect-[4/3]"
                data-ai-hint="product image"
            />
        </CardHeader>
        <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-muted-foreground h-10 overflow-hidden text-ellipsis">{product.description}</p>
            <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                 {user ? (
                    <Button>Buy Now</Button>
                ) : (
                    <Button asChild>
                        <Link href="/login">Buy Now</Link>
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
);

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase.from('products').select('*');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">All Products</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} user={user} />
          ))}
        </div>
      </main>
    </div>
  );
}
