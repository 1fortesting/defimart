'use client';

import { Card } from '@/components/ui/card';
import { Tv, Shirt, Home, Apple } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Electronics', icon: Tv, href: '/search?category=Electronics+%26+Gadgets' },
  { name: 'Fashion', icon: Shirt, href: '/search?category=Fashion+%26+Apparel' },
  { name: 'Home & Kitchen', icon: Home, href: '/search?category=Home+%26+Kitchen' },
  { name: 'Groceries', icon: Apple, href: '/search?category=Groceries+%26+Food' },
];

function CategoryCard({ name, icon: Icon, href }: { name: string, icon: React.ElementType, href: string }) {
    return (
        <Link href={href} className="group">
            <Card className="flex flex-col items-center justify-center p-2 aspect-square bg-card rounded-lg border border-border group-hover:border-primary group-hover:bg-accent/10 transition-all duration-300 ease-in-out cursor-pointer transform group-hover:-translate-y-1">
                <Icon className="h-6 w-6 text-primary mb-1 transition-transform group-hover:scale-110" />
                <span className="text-xs text-center text-foreground font-medium">{name}</span>
            </Card>
        </Link>
    )
}

export function Filters() {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Shop by Category</h2>
      <div className="grid grid-cols-4 gap-2">
        {categories.map((category) => (
          <CategoryCard key={category.name} {...category} />
        ))}
      </div>
    </div>
  );
}
