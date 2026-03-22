'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tables } from '@/types/supabase';
import { ProductCard } from '@/components/product-card';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface CategoriesClientPageProps {
    allProducts: Tables<'products'>[];
    allCategories: string[];
    allBrands: string[];
    user: User | null;
    savedProductIds: string[];
}

export default function CategoriesClientPage({ allProducts, allCategories, allBrands, user, savedProductIds: initialSavedIds }: CategoriesClientPageProps) {
    const searchParams = useSearchParams();
    
    const initialTab = searchParams.get('tab') === 'brands' ? 'brands' : 'categories';
    const initialItem = searchParams.get('item') || (initialTab === 'categories' ? (allCategories[0] || '') : (allBrands[0] || ''));

    const [mainTab, setMainTab] = useState<'categories' | 'brands'>(initialTab);
    const [selectedItem, setSelectedItem] = useState(initialItem);
    const [savedIds, setSavedIds] = useState(new Set(initialSavedIds));
    
    useEffect(() => {
        if (mainTab === 'categories' && (!selectedItem || !allCategories.includes(selectedItem))) {
            setSelectedItem(allCategories[0] || '');
        } else if (mainTab === 'brands' && (!selectedItem || !allBrands.includes(selectedItem))) {
            setSelectedItem(allBrands[0] || '');
        }
    }, [mainTab, allCategories, allBrands, selectedItem]);

    const itemsToShow = mainTab === 'categories' ? allCategories : allBrands;

    const filteredProducts = allProducts.filter(p => {
        return mainTab === 'categories' ? p.category === selectedItem : p.brand === selectedItem;
    });
    
    const handleUnsave = (productId: string) => {
        setSavedIds(currentIds => {
            const newIds = new Set(currentIds);
            newIds.delete(productId);
            return newIds;
        });
    };

    const handleTabChange = (tab: 'categories' | 'brands') => {
        setMainTab(tab);
        setSelectedItem(tab === 'categories' ? allCategories[0] || '' : allBrands[0] || '');
    };

    return (
        <main className="flex-1 pb-20 md:pb-0 bg-background">
            <div className="grid grid-cols-[100px_1fr] md:grid-cols-[250px_1fr] h-[calc(100vh-120px)] md:h-[calc(100vh-105px)]">
                {/* Sidebar */}
                <div className="bg-muted/40 h-full overflow-y-auto flex flex-col">
                    <div className="flex flex-col md:flex-row border-b border-border">
                         <button 
                            onClick={() => handleTabChange('categories')}
                            className={cn(
                                "p-3 text-center text-sm md:text-base md:flex-1 md:px-4 md:py-3 transition-colors font-semibold",
                                mainTab === 'categories' ? 'text-primary border-b-2 md:border-b-0 md:border-r-2 border-primary bg-background' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            )}
                        >
                            Categories
                        </button>
                         <button 
                            onClick={() => handleTabChange('brands')}
                            className={cn(
                                "p-3 text-center text-sm md:text-base md:flex-1 md:px-4 md:py-3 transition-colors font-semibold",
                                mainTab === 'brands' ? 'text-primary border-b-2 md:border-b-0 md:border-r-2 border-primary bg-background' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            )}
                        >
                            Brands
                        </button>
                    </div>
                    <nav className="flex flex-col text-sm flex-1">
                        {itemsToShow.map(item => (
                            <button
                                key={item}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "p-3 text-center md:text-left md:px-4 md:py-3 transition-colors truncate",
                                    selectedItem === item ? 'bg-background font-semibold text-primary' : 'hover:bg-background/50'
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="overflow-y-auto p-4 md:p-6">
                    <h1 className="text-xl md:text-2xl font-bold mb-4">{selectedItem}</h1>
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground py-16">
                           <div>
                                <p className="text-lg">No products found.</p>
                                <p>There are no products listed under '{selectedItem}'.</p>
                           </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
