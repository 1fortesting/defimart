
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
            <div className="flex flex-col md:grid md:grid-cols-[250px_1fr] md:h-[calc(100vh-105px)]">
                {/* Navigation: Sidebar on Desktop, Top bar on Mobile */}
                <div className="bg-muted/40 flex flex-col md:h-full border-b md:border-b-0 md:border-r border-border sticky top-0 md:relative z-30 shadow-sm md:shadow-none">
                    <div className="flex border-b border-border bg-background">
                         <button 
                            onClick={() => handleTabChange('categories')}
                            className={cn(
                                "flex-1 p-3 text-center text-sm md:text-base transition-all font-semibold",
                                mainTab === 'categories' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'hover:bg-muted text-muted-foreground'
                            )}
                        >
                            Categories
                        </button>
                         <button 
                            onClick={() => handleTabChange('brands')}
                            className={cn(
                                "flex-1 p-3 text-center text-sm md:text-base transition-all font-semibold",
                                mainTab === 'brands' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'hover:bg-muted text-muted-foreground'
                            )}
                        >
                            Brands
                        </button>
                    </div>
                    <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar bg-background md:bg-transparent py-1 md:py-0">
                        {itemsToShow.map(item => (
                            <button
                                key={item}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "px-4 py-2.5 md:py-3 text-sm whitespace-nowrap md:text-left transition-colors flex-shrink-0 md:flex-shrink",
                                    selectedItem === item 
                                        ? 'bg-primary/10 text-primary font-bold md:border-l-4 border-primary rounded-full md:rounded-none mx-2 md:mx-0 my-1 md:my-0' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full md:rounded-none mx-1 md:mx-0 my-1 md:my-0'
                                )}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="overflow-y-auto p-4 md:p-6 flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{selectedItem}</h1>
                        <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {filteredProducts.length} items
                        </span>
                    </div>
                    
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
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
                        <div className="flex items-center justify-center min-h-[50vh] text-center text-muted-foreground py-16">
                           <div className="max-w-xs">
                                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                </div>
                                <p className="text-lg font-semibold text-foreground">No products found</p>
                                <p className="text-sm mt-1">There are no items listed under '{selectedItem}' at this time.</p>
                           </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
