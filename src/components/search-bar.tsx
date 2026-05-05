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
  const searchContainerRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length > 0) {
      const lowercasedQuery = query.toLowerCase();
      const results = products.filter(product =>
        product.name.toLowerCase().includes(lowercasedQuery) ||
        (product.category && product.category.toLowerCase().includes(lowercasedQuery)) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
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
    <form onSubmit={handleSubmit} className={cn("relative w-full max-w-2xl mx-auto", className)} ref={searchContainerRef}>
        <div className="relative w-full flex items-center bg-background rounded-full border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                placeholder="Search for anything..."
                className="px-11 w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-11 bg-transparent rounded-none text-center"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />
            {query && (
                <button 
                    type="button" 
                    onClick={() => setQuery('')} 
                    className="absolute right-[90px] p-1 hover:bg-muted rounded-full transition-colors" 
                    aria-label="Clear search"
                >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            )}
            <Button 
                type="submit" 
                className="absolute right-0 h-full rounded-none px-6 font-bold hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground"
            >
                Search
            </Button>
        </div>

        {showResults && (
            <div className="absolute top-full mt-2 w-full bg-white border border-[var(--border)] rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden flex flex-col">
                <div className="bg-[var(--gold)] px-4 py-2">
                    <p className="text-[10px] font-syne font-bold text-white uppercase tracking-wider">Search Results</p>
                </div>
                <div className="overflow-y-auto p-2">
                    {filteredProducts.length > 0 ? (
                        <ul className="space-y-1">
                        {filteredProducts.map(product => {
                            const isDiscountActive = product.discount_percentage && product.discount_end_date && new Date(product.discount_end_date) > new Date();
                            const discountedPrice = isDiscountActive
                                ? product.price - (product.price * (product.discount_percentage! / 100))
                                : product.price;

                            return (
                                <li key={product.id}>
                                    <Link href={`/products/${product.id}`} onClick={handleSelect} className="flex items-center gap-4 p-2.5 hover:bg-[var(--surface-2)] rounded-xl transition-colors">
                                        <div className="relative h-10 w-10 flex-shrink-0 bg-[var(--surface-2)] rounded-lg">
                                            <Image
                                                src={product.image_urls?.[0] || 'https://picsum.photos/seed/1/40/40'}
                                                alt={product.name}
                                                fill
                                                className="rounded-lg object-contain p-1"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate text-[var(--dark)]">{product.name}</p>
                                            <p className="text-xs text-[var(--gold)] font-bold">GHS {discountedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </Link>
                                </li>
                            )
                        })}
                        </ul>
                    ) : (
                        <p className="p-4 text-sm text-[var(--muted)] text-center font-medium">No results found.</p>
                    )}
                </div>
            </div>
        )}
    </form>
  );
}
