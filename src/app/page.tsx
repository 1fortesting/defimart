import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';
import { Header } from '@/components/header';
import { Filters } from '@/components/filters';
import { addToCart } from './cart/actions';
import { Badge } from '@/components/ui/badge';
import { ProductCarousel } from '@/components/product-carousel';

const ProductCard = ({ product, user }: { product: Tables<'products'>; user: any }) => {
    const getStockLabel = () => {
        if (product.quantity === null || product.quantity === undefined) return null;
        if (product.quantity > 10) {
            return <Badge variant="secondary" className="border-green-500/50 bg-green-500/10 text-green-500">In Stock</Badge>;
        }
        if (product.quantity > 0 && product.quantity <= 5) {
            return <Badge variant="destructive">Few left</Badge>;
        }
        if (product.quantity === 0) {
            return <Badge variant="outline">Out of Stock</Badge>;
        }
        return null;
    };
    
    return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0 relative">
            <Link href="#">
                <Image
                    src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/600/400'}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="object-cover w-full aspect-[4/3] group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="product image"
                />
            </Link>
             <div className="absolute top-2 right-2">
                {getStockLabel()}
            </div>
        </CardHeader>
        <CardContent className="p-4">
            <h3 className="text-lg font-semibold truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground h-10 overflow-hidden text-ellipsis">{product.description}</p>
            <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold">GHS {product.price.toFixed(2)}</span>
                 {user ? (
                    <form action={addToCart}>
                        <input type="hidden" name="productId" value={product.id} />
                        <Button type="submit" disabled={product.quantity === 0}>
                            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                    </form>
                ) : (
                    <Button asChild>
                        <Link href="/login">Add to Cart</Link>
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
)};

export default async function Home() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: products } = await supabase.from('products').select('*');
  
  const allProducts = products || [];

  // Select 5 random products for the carousel
  const shuffledProducts = [...allProducts].sort(() => 0.5 - Math.random());
  const carouselProducts = shuffledProducts.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {carouselProducts.length > 0 && <ProductCarousel products={carouselProducts} />}
        
        <div className="p-4 md:p-8">
            <Filters />
            
            <h1 className="text-3xl font-bold mb-8 mt-12">All Products</h1>
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} user={user} />
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}
