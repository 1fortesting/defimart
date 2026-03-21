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
    { name: 'Electronics & Gadgets', icon: Tv, href: '#' },
    { name: 'Fashion & Apparel', icon: Shirt, href: '#' },
    { name: 'Home & Kitchen', icon: Home, href: '#' },
    { name: 'Health & Beauty', icon: Heart, href: '#' },
    { name: 'Sports & Fitness', icon: Dumbbell, href: '#' },
    { name: 'Books & Stationery', icon: BookOpen, href: '#' },
    { name: 'Groceries & Food', icon: Apple, href: '#' },
    { name: 'Other', icon: MoreHorizontal, href: '#' },
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
