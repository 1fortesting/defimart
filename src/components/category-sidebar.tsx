'use client';

import {
  Apple,
  BookOpen,
  Dumbbell,
  Heart,
  Home,
  MoreHorizontal,
  Shirt,
  Tv,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
    { name: 'Electronics & Gadgets', icon: Tv, href: '/search?category=Electronics+%26+Gadgets' },
    { name: 'Fashion & Apparel', icon: Shirt, href: '/search?category=Fashion+%26+Apparel' },
    { name: 'Home & Kitchen', icon: Home, href: '/search?category=Home+%26+Kitchen' },
    { name: 'Health & Beauty', icon: Heart, href: '/search?category=Health+%26+Beauty' },
    { name: 'Sports & Fitness', icon: Dumbbell, href: '/search?category=Sports+%26+Fitness' },
    { name: 'Books & Stationery', icon: BookOpen, href: '/search?category=Books+%26+Stationery' },
    { name: 'Groceries & Food', icon: Apple, href: '/search?category=Groceries+%26+Food' },
    { name: 'Other', icon: MoreHorizontal, href: '/search?category=Other' },
];

export function CategorySidebar() {
    return (
        <Card>
            <CardContent className="p-3">
                <nav className="flex flex-col gap-1">
                    {categories.map((category) => (
                        <Link
                            key={category.name}
                            href={category.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-muted hover:text-primary transition-colors"
                        >
                            <category.icon className="h-5 w-5" />
                            <span>{category.name}</span>
                        </Link>
                    ))}
                </nav>
            </CardContent>
        </Card>
    );
}
