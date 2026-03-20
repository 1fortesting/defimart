import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { Header } from '@/components/header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filters } from '@/components/filters';
import { addToCart } from './cart/actions';

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
                <span className="text-lg font-bold">GHS {product.price.toFixed(2)}</span>
                 {user ? (
                    <form action={addToCart}>
                        <input type="hidden" name="productId" value={product.id} />
                        <Button type="submit">Add to Cart</Button>
                    </form>
                ) : (
                    <Button asChild>
                        <Link href="/login">Add to Cart</Link>
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
      <Header />
      <main className="flex-1 p-8">
        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
        </Tabs>

        <Filters />
        
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
