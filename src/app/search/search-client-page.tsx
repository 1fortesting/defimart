'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Tables } from '@/types/supabase';
import { ProductCard } from '@/components/product-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet"
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const categories = [
    "Electronics & Gadgets",
    "Fashion & Apparel",
    "Home & Kitchen",
    "Health & Beauty",
    "Sports & Fitness",
    "Books & Stationery",
    "Groceries & Food",
    "Other"
];

interface SearchClientPageProps {
  initialQuery: string;
  allProducts: Tables<'products'>[];
  user: User | null;
  savedProductIds: string[];
}

export default function SearchClientPage({
  initialQuery,
  allProducts,
  user,
  savedProductIds: initialSavedIds,
}: SearchClientPageProps) {
  const [filteredProducts, setFilteredProducts] = useState<Tables<'products'>[]>([]);
  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds));

  // Filter states
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 30000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [sortBy, setSortBy] = useState('popularity');

  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    allProducts.forEach(p => {
        if (p.brand) {
            brandSet.add(p.brand);
        }
    });
    return Array.from(brandSet).sort();
  }, [allProducts]);

  useEffect(() => {
    let results = [...allProducts];

    // 1. Filter by search query
    if (query) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // 2. Filter by category
    if (selectedCategories.length > 0) {
      results = results.filter(p => p.category && selectedCategories.includes(p.category));
    }

    // 3. Filter by price
    results = results.filter(p => {
        const discountedPrice = p.discount_percentage && p.discount_end_date && new Date(p.discount_end_date) > new Date()
            ? p.price - (p.price * (p.discount_percentage / 100))
            : p.price;
        return discountedPrice >= priceRange[0] && discountedPrice <= priceRange[1];
    });

    // 4. Filter by brand
    if (selectedBrands.length > 0) {
        results = results.filter(p => p.brand && selectedBrands.includes(p.brand));
    }
    
    // 5. Filter by discount
    if (discount > 0) {
        results = results.filter(p => p.discount_percentage && p.discount_percentage >= discount);
    }

    // 6. Sort
    switch (sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      // Default to popularity (can be random for now)
      default:
         results.sort(() => 0.5 - Math.random());
        break;
    }

    setFilteredProducts(results);
  }, [query, selectedCategories, priceRange, selectedBrands, discount, sortBy, allProducts]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };
  
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };
  
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 30000]);
    setTempPriceRange([0, 30000]);
    setSelectedBrands([]);
    setDiscount(0);
  };

  const handleUnsave = (productId: string) => {
    setSavedIds(currentIds => {
      const newIds = new Set(currentIds);
      newIds.delete(productId);
      return newIds;
    });
  };

  const FilterControls = () => (
    <Accordion type="multiple" defaultValue={['category', 'price']} className="w-full">
        <AccordionItem value="category">
            <AccordionTrigger className="text-lg font-semibold">Category</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
                {categories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                        <Checkbox id={`cat-mob-${cat}`} checked={selectedCategories.includes(cat)} onCheckedChange={() => handleCategoryToggle(cat)} />
                        <Label htmlFor={`cat-mob-${cat}`} className="font-normal cursor-pointer">{cat}</Label>
                    </div>
                ))}
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price">
            <AccordionTrigger className="text-lg font-semibold">Price (GHS)</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
                 <Slider
                    value={tempPriceRange}
                    onValueChange={(value) => setTempPriceRange(value as [number, number])}
                    max={30000}
                    step={100}
                 />
                 <div className="flex items-center gap-2">
                    <Input value={tempPriceRange[0]} onChange={e => setTempPriceRange([+e.target.value, tempPriceRange[1]])} placeholder="Min"/>
                    <span>-</span>
                    <Input value={tempPriceRange[1]} onChange={e => setTempPriceRange([tempPriceRange[0], +e.target.value])} placeholder="Max"/>
                 </div>
                 <Button onClick={() => setPriceRange(tempPriceRange)} className="w-full">Apply Price</Button>
            </AccordionContent>
        </AccordionItem>
        {brands.length > 0 && (
            <AccordionItem value="brand">
                <AccordionTrigger className="text-lg font-semibold">Brand</AccordionTrigger>
                <AccordionContent className="pt-2 space-y-2">
                    {brands.map(brand => (
                        <div key={brand} className="flex items-center space-x-2">
                            <Checkbox id={`brand-mob-${brand}`} checked={selectedBrands.includes(brand)} onCheckedChange={() => handleBrandToggle(brand)} />
                            <Label htmlFor={`brand-mob-${brand}`} className="font-normal cursor-pointer">{brand}</Label>
                        </div>
                    ))}
                </AccordionContent>
            </AccordionItem>
        )}
        <AccordionItem value="discount">
            <AccordionTrigger className="text-lg font-semibold">Discount Percentage</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="discount-mob-50" checked={discount === 50} onCheckedChange={() => setDiscount(discount === 50 ? 0 : 50)} />
                    <Label htmlFor="discount-mob-50" className="font-normal cursor-pointer">50% or more</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="discount-mob-20" checked={discount === 20} onCheckedChange={() => setDiscount(discount === 20 ? 0 : 20)} />
                    <Label htmlFor="discount-mob-20" className="font-normal cursor-pointer">20% or more</Label>
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );

  return (
    <div className="pb-20 lg:pb-0">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="/search">All Products</BreadcrumbLink>
                </BreadcrumbItem>
                {query && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{query}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="hidden lg:block space-y-6">
          <FilterControls />
        </aside>
        <main className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">
                Shop All Products <span className="text-muted-foreground font-normal">({filteredProducts.length} products found)</span>
            </h1>
            <div className="hidden lg:block">
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-auto md:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                user={user}
                isSaved={savedIds.has(product.id)}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <h2 className="text-2xl font-bold">No products found</h2>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </main>
      </div>

       <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-2 flex gap-2 z-40">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1">
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sort
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                    <SheetHeader>
                        <SheetTitle>Sort by</SheetTitle>
                    </SheetHeader>
                     <RadioGroup value={sortBy} onValueChange={setSortBy} className="mt-4">
                        <SheetClose asChild>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="popularity" id="sort-pop" />
                                <Label htmlFor="sort-pop" className="font-normal text-base flex-1 py-3">Popularity</Label>
                            </div>
                        </SheetClose>
                         <SheetClose asChild>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price-asc" id="sort-asc" />
                                <Label htmlFor="sort-asc" className="font-normal text-base flex-1 py-3">Price: Low to High</Label>
                            </div>
                         </SheetClose>
                         <SheetClose asChild>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price-desc" id="sort-desc" />
                                <Label htmlFor="sort-desc" className="font-normal text-base flex-1 py-3">Price: High to Low</Label>
                            </div>
                         </SheetClose>
                         <SheetClose asChild>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="newest" id="sort-new" />
                                <Label htmlFor="sort-new" className="font-normal text-base flex-1 py-3">Newest</Label>
                            </div>
                         </SheetClose>
                    </RadioGroup>
                </SheetContent>
            </Sheet>

            <Sheet>
                <SheetTrigger asChild>
                     <Button variant="outline" className="flex-1">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85%] flex flex-col">
                    <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        <FilterControls />
                    </div>
                    <Separator />
                    <SheetFooter className="flex-row gap-2 pt-4">
                        <Button variant="outline" onClick={handleClearFilters} className="flex-1">Clear</Button>
                        <SheetClose asChild>
                            <Button className="flex-1">Apply</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
      </div>

    </div>
  );
}
