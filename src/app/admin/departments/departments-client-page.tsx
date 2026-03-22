'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

const departments = [
  {
    name: 'Central Admin',
    description: 'Oversee analytics, sales data, and global settings.',
    icon: '🏢',
    passwordEnvVar: 'NEXT_PUBLIC_CEO_PASSWORD',
    href: '/admin/central-admin',
    image: 'https://picsum.photos/seed/hq/600/400',
    aiHint: 'office building'
  },
  {
    name: 'Sales Department',
    description: 'Manage incoming orders, track statuses, and interact with customers.',
    icon: '📈',
    passwordEnvVar: 'NEXT_PUBLIC_SALES_PASSWORD',
    href: '/admin/sales',
    image: 'https://picsum.photos/seed/sales-dept/600/400',
    aiHint: 'retail store'
  },
  {
    name: 'Procurement',
    description: 'Add new products, manage inventory, and set discounts.',
    icon: '📦',
    passwordEnvVar: 'NEXT_PUBLIC_PROCUREMENT_PASSWORD',
    href: '/admin/procurement',
    image: 'https://picsum.photos/seed/procurement-dept/600/400',
    aiHint: 'warehouse boxes'
  },
  {
    name: 'Logistics',
    description: 'Manage product inventory, stock levels, and discounts.',
    icon: '🚚',
    passwordEnvVar: 'NEXT_PUBLIC_LOGISTICS_PASSWORD',
    href: '/admin/logistics',
    image: 'https://picsum.photos/seed/logistics/600/400',
    aiHint: 'delivery truck'
  }
];

export default function DepartmentsClientPage({ user, handleLogout }: { user: User | null, handleLogout: () => void }) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSelectDept = (deptName: string) => {
    if (selectedDept === deptName) {
      setSelectedDept(null);
    } else {
      setSelectedDept(deptName);
      setPassword('');
    }
  };

  const handleLogin = (e: React.FormEvent, dept: typeof departments[0]) => {
    e.preventDefault();
    setIsLoading(true);

    let correctPassword;
    if (dept.passwordEnvVar === 'NEXT_PUBLIC_CEO_PASSWORD') correctPassword = process.env.NEXT_PUBLIC_CEO_PASSWORD;
    if (dept.passwordEnvVar === 'NEXT_PUBLIC_SALES_PASSWORD') correctPassword = process.env.NEXT_PUBLIC_SALES_PASSWORD;
    if (dept.passwordEnvVar === 'NEXT_PUBLIC_PROCUREMENT_PASSWORD') correctPassword = process.env.NEXT_PUBLIC_PROCUREMENT_PASSWORD;
    if (dept.passwordEnvVar === 'NEXT_PUBLIC_LOGISTICS_PASSWORD') correctPassword = process.env.NEXT_PUBLIC_LOGISTICS_PASSWORD;


    if (password === correctPassword) {
      sessionStorage.setItem(`defimart-dept-auth-${dept.name.toLowerCase().replace(' ', '-')}`, 'true');
      toast({ variant: 'success', title: `Welcome to ${dept.name}!` });
      router.push(dept.href);
    } else {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Incorrect password.' });
      setIsLoading(false);
    }
  };

  const displayName = user?.user_metadata.display_name || user?.email;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.user_metadata.avatar_url ?? undefined} />
                            <AvatarFallback>{displayName?.charAt(0)?.toUpperCase() ?? 'A'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleLogout()} className="text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>

      <div className="text-center mb-12">
        <Image src="https://iili.io/qO5Jeou.png" alt="DEFIMART Logo" width={240} height={50} className="mx-auto mb-4 object-contain" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Admin Departments</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Select your department to access specialized tools and manage your operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
        {departments.map((dept) => {
          const isSelected = selectedDept === dept.name;
          return (
            <motion.div
              key={dept.name}
              layout
              transition={{ duration: 0.5, type: 'spring' }}
              className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isSelected ? 'ring-4 ring-primary' : 'ring-1 ring-border'}`}
              style={{
                filter: selectedDept && !isSelected ? 'blur(3px) grayscale(80%)' : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div className="bg-card h-full flex flex-col">
                <div className="relative">
                  <Image
                    src={dept.image}
                    alt={dept.name}
                    width={600}
                    height={400}
                    data-ai-hint={dept.aiHint}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 inline-block">
                      <span className="text-2xl">{dept.icon}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <h2 className="text-2xl font-bold text-foreground">{dept.name}</h2>
                  <p className="text-muted-foreground mt-2 flex-grow">{dept.description}</p>
                  <Button
                    variant={isSelected ? "secondary" : "outline"}
                    onClick={() => handleSelectDept(dept.name)}
                    className="mt-6 w-full"
                  >
                    {isSelected ? 'Close' : 'Enter Department'}
                  </Button>
                </div>
                 <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t"
                    >
                      <form onSubmit={(e) => handleLogin(e, dept)} className="p-6 space-y-4">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="password"
                                placeholder="Enter Department Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Access'}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
