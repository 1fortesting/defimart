'use client';

import {
  Apple,
  Smartphone,
  Heart,
  Home,
  WashingMachine,
  Tv,
  Computer,
  Shirt,
  Dumbbell,
  Baby,
  Gamepad2,
  MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
    { name: 'Supermarket', icon: Apple, href: '#' },
    { name: 'Phones & Tablets', icon: Smartphone, href: '#' },
    { name: 'Health & Beauty', icon: Heart, href: '#' },
    { name: 'Home & Office', icon: Home, href: '#' },
    { name: 'Appliances', icon: WashingMachine, href: '#' },
    { name: 'Electronics', icon: Tv, href: '#' },
    { name: 'Computing', icon: Computer, href: '#' },
    { name: 'Fashion', icon: Shirt, href: '#' },
    { name: 'Sporting Goods', icon: Dumbbell, href: '#' },
    { name: 'Baby Products', icon: Baby, href: '#' },
    { name: 'Gaming', icon: Gamepad2, href: '#' },
    { name: 'Other categories', icon: MoreHorizontal, href: '#' },
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
