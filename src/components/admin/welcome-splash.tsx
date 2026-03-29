'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, TrendingUp, ShoppingBag, Truck } from 'lucide-react';

interface WelcomeSplashProps {
    departmentName: string;
    roleName: string;
    message: string;
    onFinished: () => void;
}

const departmentIcons: { [key: string]: React.ElementType } = {
    'Central Admin': Building,
    'Sales Department': TrendingUp,
    'Procurement': ShoppingBag,
    'Logistics': Truck
};

export function WelcomeSplash({ departmentName, roleName, message, onFinished }: WelcomeSplashProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinished();
        }, 3500); // 3.5 seconds

        return () => clearTimeout(timer);
    }, [onFinished]);
    
    const Icon = departmentIcons[departmentName] || Building;

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="text-center p-8"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 150 }}
                    className="inline-block p-6 bg-muted rounded-full mb-6"
                >
                    <Icon className="h-16 w-16 text-primary" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-4xl font-bold"
                >
                    Welcome, {roleName}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-lg text-muted-foreground mt-2"
                >
                    {departmentName}
                </motion.p>
                 <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="text-md text-muted-foreground mt-4 italic max-w-md"
                >
                    &quot;{message}&quot;
                </motion.p>
            </motion.div>
        </div>
    );
}
