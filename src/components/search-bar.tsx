'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tables } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function SearchBar({ products, className }: { products: Tables<'products'>[], className?: string }) {
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Tables<'products'>[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length > 0) {
      const lowercasedQuery = query.toLowerCase();
      const results = products.filter(product =>
        product.name.toLowerCase().includes(lowercasedQuery) ||
        (product.category && product.category.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredProducts(results.slice(0, 10)); // Limit results
    } else {
      setFilteredProducts([]);
    }
  }, [query, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = () => {
    setIsFocused(false);
    setQuery('');
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
        router.push(`/search?q=${query.trim()}`);
        handleSelect();
    }
  }

  const showResults = isFocused && query.length > 0;

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)} ref={searchContainerRef}>
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                placeholder="Search for anything..."
                className="pl-10 pr-10 w-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />
            {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search">
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
             {showResults && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                    <ul>
                    {filteredProducts.map(product => {
                        const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
                        const discountedPrice = isDiscountActive
                            ? product.price - (product.price * (product.discount_percentage! / 100))
                            : product.price;

                        return (
                            <li key={product.id}>
                                <Link href={`/products/${product.id}`} onClick={handleSelect} className="flex items-center gap-4 p-3 hover:bg-muted">
                                    <Image
                                        src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/40/40'}
                                        alt={product.name}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover aspect-square"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">GHS {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                    </ul>
                ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
                )}
                </div>
            )}
        </div>
        <Button type="submit" className="absolute right-0 top-0 h-full rounded-l-none hidden sm:inline-flex">Search</Button>
    </form>
  );
}
