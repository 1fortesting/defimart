'use client';

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentLoginProps {
    departmentName: string;
    passwordEnvVar: string;
    sessionKey: string;
    onSuccess: () => void;
}

const welcomeMessages: { [key: string]: string } = {
    'Central Admin': 'Welcome, Chief. The command center is ready for your overview.',
    'Sales': 'Welcome to the Sales Deck. Let\'s close some deals and track our success.',
    'Logistics': 'Welcome to the Warehouse. Time to manage our inventory and product flow.',
}

export function DepartmentLogin({ departmentName, passwordEnvVar, sessionKey, onSuccess }: DepartmentLoginProps) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        let correctPassword;
        if (passwordEnvVar === 'NEXT_PUBLIC_CEO_PASSWORD') {
            correctPassword = process.env.NEXT_PUBLIC_CEO_PASSWORD;
        } else if (passwordEnvVar === 'NEXT_PUBLIC_SALES_PASSWORD') {
            correctPassword = process.env.NEXT_PUBLIC_SALES_PASSWORD;
        } else if (passwordEnvVar === 'NEXT_PUBLIC_LOGISTICS_PASSWORD') {
            correctPassword = process.env.NEXT_PUBLIC_LOGISTICS_PASSWORD;
        }

        if (!correctPassword) {
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'Department password is not set. Please contact the developer.',
            });
            setIsLoading(false);
            return;
        }

        if (password === correctPassword) {
            sessionStorage.setItem(sessionKey, 'true');
            toast({
                variant: 'success',
                title: `Access Granted to ${departmentName}`,
                description: welcomeMessages[departmentName] || `You now have access.`
            });
            onSuccess();
        } else {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'Incorrect password for this department.',
            });
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Building className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Department Access Required</CardTitle>
                    <CardDescription>Enter the password for the <span className="font-semibold text-primary">{departmentName}</span> department.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="department-password">Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="department-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Verifying...' : 'Unlock Department'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
