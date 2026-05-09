
'use client';

import { useEffect, useState, useTransition, useActionState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleShopStatus, addSellerProduct, updateShopInfo, updateSellerProduct } from '../actions';
import { updateOrderStatus } from '@/app/admin/sales/actions';
import { useToast } from '@/hooks/use-toast';
import { 
    Package, 
    Plus, 
    Eye, 
    Clock, 
    Loader2, 
    LayoutDashboard, 
    ShoppingBag, 
    Users, 
    Settings, 
    TrendingUp, 
    Phone, 
    Image as ImageIcon,
    Trash2,
    Store,
    RefreshCw,
    UploadCloud,
    Menu,
    Home,
    LogOut,
    Edit,
    Sparkles,
    FileText,
    Truck,
    Search,
    Bell,
    DollarSign,
    Box,
    ShoppingBasket,
    MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { generateProductDescription } from '@/ai/flows/ai-product-description-assistant';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

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

function AddProductDialog({ onPublishSuccess }: { onPublishSuccess: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [uploadCategory, setUploadCategory] = useState('');
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGenerating, startGeneratingTransition] = useTransition();

    const [offersDelivery, setOffersDelivery] = useState(false);
    const [deliveryPriceType, setDeliveryPriceType] = useState('fixed');

    const [state, action, isPending] = useActionState(addSellerProduct, { success: false, error: null });

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            setImagePreview(null);
            setUploadCategory('');
            setProductName('');
            setDescription('');
            setOffersDelivery(false);
            setDeliveryPriceType('fixed');
            toast({ variant: 'success', title: 'Listing Published!', description: 'Your product is now live.' });
            onPublishSuccess();
        } else if (state.error) {
            toast({ title: 'Listing Failed', description: state.error, variant: 'destructive' });
        }
    }, [state, toast, onPublishSuccess]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGenerateDescription = () => {
        if (!productName) {
            toast({ variant: 'destructive', title: 'Name required', description: 'Enter a product name to generate description.' });
            return;
        }
        startGeneratingTransition(async () => {
            try {
                const result = await generateProductDescription({
                    productName,
                    category: uploadCategory || 'General',
                });
                if (result.description) {
                    setDescription(result.description.replace(' (AI Enhanced)', ''));
                    toast({ variant: 'success', title: 'AI Content Ready', description: 'Description generated successfully.' });
                }
            } catch (e) {
                toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to generate description.' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#F5A623] hover:bg-[#E89512] text-white font-black uppercase tracking-[1.5px] text-[10px] rounded-xl px-5 h-10 border-none shadow-lg shadow-orange-500/10">
                    <Plus className="h-3.5 w-3.5 mr-2" /> Publish Item
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[650px] p-0 overflow-hidden rounded-[32px] flex flex-col max-h-[90vh] border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-white uppercase">New Listing</DialogTitle>
                        <DialogDescription className="text-primary-foreground/90 text-xs font-medium">
                            Publish a product to your digital storefront.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <form action={action} className="flex flex-col flex-1 overflow-hidden bg-background">
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 hide-scrollbar">
                        <div className="grid gap-2">
                            <Label htmlFor="name_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Item Name</Label>
                            <Input id="name_add" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. MacBook Pro M3" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="price_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Price (GHS)</Label>
                                <Input id="price_add" name="price" type="number" step="0.01" placeholder="0.00" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="quantity_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Stock Units</Label>
                                <Input id="quantity_add" name="quantity" type="number" min="0" placeholder="1" defaultValue="1" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="category_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                <Select name="category" required onValueChange={setUploadCategory}>
                                    <SelectTrigger className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
                                <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 px-3 text-[9px] font-black uppercase rounded-full border-primary/20 text-primary" onClick={handleGenerateDescription} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI Assistant
                                </Button>
                            </div>
                            <Textarea id="description_add" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-muted/30 border-2 text-sm md:text-base rounded-xl resize-none" />
                        </div>

                        <div className="p-5 md:p-6 bg-muted/20 rounded-2xl border-2 border-dashed space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <Truck className="h-5 w-5 text-primary" />
                                    </div>
                                    <Label htmlFor="offers_delivery_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Offer Delivery</Label>
                                </div>
                                <Switch 
                                    id="offers_delivery_add" 
                                    name="offers_delivery" 
                                    checked={offersDelivery} 
                                    onCheckedChange={setOffersDelivery}
                                    className="data-[state=unchecked]:bg-slate-300"
                                />
                            </div>

                            {offersDelivery && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-muted pt-5">
                                    <div className="grid gap-3">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pricing Model</Label>
                                        <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all">
                                                <RadioGroupItem value="fixed" id="fixed_add" />
                                                <Label htmlFor="fixed_add" className="text-xs font-bold cursor-pointer">Fixed Fee</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all">
                                                <RadioGroupItem value="location_based" id="location_based_add" />
                                                <Label htmlFor="location_based_add" className="text-xs font-bold cursor-pointer">Location Based</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {deliveryPriceType === 'fixed' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_price_add" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Fee (GHS)</Label>
                                            <Input id="delivery_price_add" name="delivery_price" type="number" step="0.01" placeholder="0.00" className="bg-background border-2 h-11 text-sm rounded-xl" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Media</Label>
                            <Input id="image_add" name="image" type="file" accept="image/*" required onChange={handleImageChange} className="bg-muted/30 border-2 h-14 text-xs rounded-xl pt-4 cursor-pointer file:font-bold file:text-primary" />
                            {imagePreview && (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner group">
                                    <Image src={imagePreview} alt="" fill className="object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 border-t bg-background flex-shrink-0">
                        <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-[2px] shadow-2xl shadow-primary/20 rounded-2xl" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin mr-3 h-5 w-5" /> : 'Confirm & Publish'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditProductDialog({ product, onUpdateSuccess }: { product: any, onUpdateSuccess: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [uploadCategory, setUploadCategory] = useState(categories.includes(product.category) ? product.category : 'Other');
    const [imagePreview, setImagePreview] = useState<string | null>(product.image_urls?.[0] || null);
    
    const [productName, setProductName] = useState(product.name || '');
    const [description, setDescription] = useState(product.description?.replace(' (AI Enhanced)', '') || '');
    const [isGenerating, startGeneratingTransition] = useTransition();

    const [offersDelivery, setOffersDelivery] = useState(product.offers_delivery || false);
    const [deliveryPriceType, setDeliveryPriceType] = useState(product.delivery_price_type || 'fixed');

    const [state, action, isPending] = useActionState(updateSellerProduct, { success: false, error: null });

    useEffect(() => {
        if (state.success) {
            setIsOpen(false);
            toast({ variant: 'success', title: 'Listing Updated', description: 'Changes saved successfully.' });
            onUpdateSuccess();
        } else if (state.error) {
            toast({ title: 'Update Failed', description: state.error, variant: 'destructive' });
        }
    }, [state, toast, onUpdateSuccess]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGenerateDescription = () => {
        if (!productName) {
            toast({ variant: 'destructive', title: 'Name required', description: 'Please enter a product name first.' });
            return;
        }
        startGeneratingTransition(async () => {
            try {
                const result = await generateProductDescription({
                    productName,
                    category: uploadCategory || 'General',
                });
                if (result.description) {
                    setDescription(result.description.replace(' (AI Enhanced)', ''));
                    toast({ variant: 'success', title: 'AI Description Ready', description: 'Marketing copy has been enhanced.' });
                }
            } catch (e) {
                toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not connect to AI services.' });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[650px] p-0 overflow-hidden rounded-[32px] flex flex-col max-h-[90vh] border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black tracking-tight text-white">Edit Listing</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 text-xs md:text-sm">
                            Modify your product details and availability.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <form action={action} className="flex flex-col flex-1 overflow-hidden bg-background">
                    <input type="hidden" name="id" value={product.id} />
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 hide-scrollbar">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Name</Label>
                            <Input id="name" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Price (GHS)</Label>
                                <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Units In Stock</Label>
                                <Input id="quantity" name="quantity" type="number" min="0" defaultValue={product.quantity || 1} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                <Select name="category" defaultValue={categories.includes(product.category) ? product.category : 'Other'} required onValueChange={setUploadCategory}>
                                    <SelectTrigger className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {uploadCategory === 'Other' && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="custom_category" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Custom Category Name</Label>
                                <Input id="custom_category" name="custom_category" defaultValue={!categories.includes(product.category) ? product.category : ''} placeholder="Custom category" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl" />
                            </div>
                        )}

                        <div className="p-5 md:p-6 bg-muted/20 rounded-2xl border-2 border-dashed space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <Truck className="h-5 w-5 text-primary" />
                                    </div>
                                    <Label htmlFor="offers_delivery_edit" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Offer Delivery</Label>
                                </div>
                                <Switch 
                                    id="offers_delivery_edit" 
                                    name="offers_delivery" 
                                    checked={offersDelivery} 
                                    onCheckedChange={setOffersDelivery}
                                    className="data-[state=unchecked]:bg-slate-300"
                                />
                            </div>

                            {offersDelivery && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-muted pt-5">
                                    <div className="grid gap-3">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pricing Model</Label>
                                        <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all">
                                                <RadioGroupItem value="fixed" id="fixed_edit" />
                                                <Label htmlFor="fixed_edit" className="text-xs font-bold cursor-pointer">Fixed Fee</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all">
                                                <RadioGroupItem value="location_based" id="location_based_edit" />
                                                <Label htmlFor="location_based_edit" className="text-xs font-bold cursor-pointer">Based on Location</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {deliveryPriceType === 'fixed' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_price_edit" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Fee (GHS)</Label>
                                            <Input id="delivery_price_edit" name="delivery_price" type="number" step="0.01" defaultValue={product.delivery_price || 0} className="bg-background border-2 h-11 text-sm rounded-xl" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Detailed Description</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 gap-1.5 px-3 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 rounded-full"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    AI Rewrite
                                </Button>
                            </div>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4} 
                                className="bg-muted/30 border-2 text-sm md:text-base rounded-xl resize-none" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Update Image (Optional)</Label>
                            <div className="flex flex-col gap-4">
                                <Input 
                                    id="image" 
                                    name="image" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="bg-muted/30 border-2 h-14 text-xs rounded-xl cursor-pointer pt-5"
                                />
                                {imagePreview && (
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner">
                                        <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-background flex-shrink-0">
                        <Button type="submit" className="w-full h-14 text-sm md:text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin mr-3 h-5 w-5" /> : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setUser(user);

        const { data: sellerData } = await supabase.from('sellers' as any).select('*').eq('user_id', user.id).maybeSingle();
        setSeller(sellerData);

        if (sellerData) {
            const { data: productsData } = await supabase
              .from('vendor_products' as any)
              .select('*')
              .eq('seller_id', user.id)
              .order('created_at', { ascending: false });
            setProducts(productsData || []);

            const { data: ordersData } = await supabase
              .from('orders')
              .select('*, products:product_id(name, image_urls), vendor_products:vendor_product_id(name, image_urls), profiles:buyer_id(display_name, phone_number, id)')
              .eq('seller_id', user.id)
              .order('created_at', { ascending: false });
            setOrders(ordersData || []);
        }
        
        setLoading(false);
    } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = () => {
    startTransition(async () => {
        await fetchData();
        router.refresh();
        toast({ title: 'Data Synchronized', description: 'Your shop information is now up to date.' });
    });
  };

  const handleToggle = (isOpen: boolean) => {
    startTransition(async () => {
      try {
        await toggleShopStatus(seller.id, isOpen);
        setSeller({ ...seller, is_open: isOpen });
        toast({ title: isOpen ? 'Shop is now OPEN' : 'Shop is now CLOSED', variant: isOpen ? 'success' : 'default' });
      } catch (e: any) {
        toast({ title: 'Update failed', description: 'Check your internet connection.', variant: 'destructive' });
      }
    });
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    startTransition(async () => {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('status', status);
        const result = await updateOrderStatus(formData);
        if (result.success) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
            toast({ title: 'Order Status Updated', variant: 'success' });
        } else {
            toast({ title: 'Update failed', description: result.error, variant: 'destructive' });
        }
    });
  };

  const handleDeleteProduct = async (productId: string) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      
      const supabase = createClient();
      const { error } = await supabase.from('vendor_products' as any).delete().eq('id', productId);
      
      if (error) {
          toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      } else {
          setProducts(products.filter(p => p.id !== productId));
          toast({ title: 'Product Deleted', variant: 'success' });
      }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  const handleUpdateShop = async (formData: FormData) => {
      startUpdateTransition(async () => {
          if (!seller) return;
          formData.append('sellerId', seller.id);
          const result = await updateShopInfo(formData);
          if (result.success) {
            toast({ 
                variant: 'success',
                title: 'Settings Saved!', 
                description: 'Changes applied. Refresh to see updates across the site.',
            });
            fetchData();
          } else {
              toast({ title: 'Error', description: result.error, variant: 'destructive' });
          }
      });
  };

  const filteredProducts = useMemo(() => {
      if (!globalSearch) return products;
      const lowerQuery = globalSearch.toLowerCase();
      return products.filter(p => 
          p.name?.toLowerCase().includes(lowerQuery) || 
          p.category?.toLowerCase().includes(lowerQuery)
      );
  }, [products, globalSearch]);

  const filteredOrders = useMemo(() => {
      if (!globalSearch) return orders;
      const lowerQuery = globalSearch.toLowerCase();
      return orders.filter(o => 
          o.profiles?.display_name?.toLowerCase().includes(lowerQuery) ||
          o.id.toLowerCase().includes(lowerQuery) ||
          (o.products?.name || o.vendor_products?.name)?.toLowerCase().includes(lowerQuery)
      );
  }, [orders, globalSearch]);

  const uniqueCustomers = useMemo(() => {
      const customersMap = new Map();
      orders.forEach(order => {
          if (order.profiles && !customersMap.has(order.profiles.id)) {
              customersMap.set(order.profiles.id, {
                  id: order.profiles.id,
                  name: order.profiles.display_name || 'Anonymous',
                  phone: order.profiles.phone_number || 'No phone',
                  totalOrders: orders.filter(o => o.buyer_id === order.profiles.id).length
              });
          }
      });
      return Array.from(customersMap.values());
  }, [orders]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  if (!seller) return <div className="p-8 text-center h-screen flex items-center justify-center flex-col"><p className="text-muted-foreground">Seller profile not found.</p><Button asChild variant="outline" className="mt-4"><Link href="/">Return Home</Link></Button></div>;

  // CRITICAL: Financials only count COMPLETED orders
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
  
  const StatCard = ({ title, value, icon: Icon, subText }: { title: string, value: string | number, icon: any, subText?: string }) => (
      <Card className="bg-white border-none shadow-sm rounded-2xl p-3 md:p-4 relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
                  <h3 className="text-lg md:text-xl font-black text-foreground">{value}</h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Icon className="h-4 w-4" />
              </div>
          </div>
          {subText && (
              <p className="text-[9px] font-bold text-muted-foreground mt-2 flex items-center gap-1">
                  {subText}
              </p>
          )}
      </Card>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row w-full overflow-hidden">
      
      <Tabs defaultValue="dashboard" className="w-full flex flex-col md:flex-row h-screen overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-[240px] bg-primary flex-col flex-shrink-0">
            <div className="p-6">
                <h2 className="text-white text-xl font-black italic uppercase tracking-tighter">Seller Hub</h2>
            </div>
            
            <div className="flex-1 px-3">
                <TabsList className="flex flex-col h-auto bg-transparent gap-1.5 w-full">
                    <TabsTrigger value="dashboard" className="w-full justify-start gap-3 rounded-xl py-3 px-4 text-white/70 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="products" className="w-full justify-start gap-3 rounded-xl py-3 px-4 text-white/70 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                        <Box className="h-4 w-4" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="w-full justify-start gap-3 rounded-xl py-3 px-4 text-white/70 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                        <ShoppingBasket className="h-4 w-4" /> Orders
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="w-full justify-start gap-3 rounded-xl py-3 px-4 text-white/70 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                        <Users className="h-4 w-4" /> Customers
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="w-full justify-start gap-3 rounded-xl py-3 px-4 text-white/70 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
                        <Settings className="h-4 w-4" /> Settings
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="p-4 mt-auto space-y-3">
                <div className="bg-white/10 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="shop-toggle-sidebar" className="text-[9px] font-black text-white uppercase tracking-widest cursor-pointer">Shop Status</Label>
                        <Switch 
                            id="shop-toggle-sidebar" 
                            checked={seller.is_open} 
                            onCheckedChange={handleToggle}
                            disabled={isPending}
                            className="scale-75 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", seller.is_open ? "bg-emerald-400" : "bg-red-400")} />
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-tighter">
                            {seller.is_open ? "Accepting Orders" : "Currently Closed"}
                        </span>
                    </div>
                </div>

                <Button asChild variant="destructive" className="w-full justify-start gap-3 h-10 font-bold uppercase text-[9px] tracking-widest shadow-lg shadow-red-900/20 bg-red-600 hover:bg-red-700">
                    <Link href="/">
                        <Home className="h-4 w-4" /> Exit Store
                    </Link>
                </Button>
            </div>
        </aside>

        {/* MOBILE HEADER */}
        <div className="md:hidden bg-primary p-4 flex items-center justify-between shadow-lg z-50">
             <h2 className="text-white text-lg font-black italic uppercase tracking-tighter">Seller Hub</h2>
             <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={handleSync} disabled={isPending} className="text-white h-9 w-9">
                    <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                 </Button>
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white h-9 w-9">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[260px] p-0 bg-primary border-none">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </SheetHeader>
                         <div className="p-8">
                            <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">Seller Hub</h2>
                        </div>
                        <div className="flex-1 px-4">
                             <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                                <SheetClose asChild><TabsTrigger value="dashboard" className="w-full justify-start gap-4 rounded-xl py-4 px-5 text-white/70 font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Dashboard</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="products" className="w-full justify-start gap-4 rounded-xl py-4 px-5 text-white/70 font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Inventory</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="orders" className="w-full justify-start gap-4 rounded-xl py-4 px-5 text-white/70 font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Orders</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="clients" className="w-full justify-start gap-4 rounded-xl py-4 px-5 text-white/70 font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Customers</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="settings" className="w-full justify-start gap-4 rounded-xl py-4 px-5 text-white/70 font-bold uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all">Settings</TabsTrigger></SheetClose>
                            </TabsList>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-white/10 p-4 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="shop-toggle-mobile" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Shop Status</Label>
                                    <Switch 
                                        id="shop-toggle-mobile" 
                                        checked={seller.is_open} 
                                        onCheckedChange={handleToggle}
                                        disabled={isPending}
                                        className="data-[state=unchecked]:bg-white/20"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", seller.is_open ? "bg-emerald-400" : "bg-red-400")} />
                                    <span className="text-[9px] font-black text-white/70 uppercase tracking-tighter">
                                        {seller.is_open ? "Accepting Orders" : "Currently Closed"}
                                    </span>
                                </div>
                            </div>
                            <Button asChild variant="destructive" className="w-full justify-start gap-4 h-12 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/40 bg-red-600">
                                <Link href="/">
                                    <Home className="h-4 w-4" /> Exit Store
                                </Link>
                            </Button>
                        </div>
                    </SheetContent>
                 </Sheet>
             </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* TOP UTILITY BAR */}
            <header className="hidden md:flex h-14 bg-white border-b items-center px-8 justify-between flex-shrink-0">
                <div className="relative w-full max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search orders, inventory..." 
                        className="pl-9 h-9 border-none bg-muted/30 focus-visible:ring-primary/10 rounded-xl text-[11px]" 
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleSync} disabled={isPending} className="text-muted-foreground h-8 w-8 rounded-full">
                        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full relative">
                        <Bell className="h-3.5 w-3.5" />
                        <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-red-500 rounded-full" />
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-2.5">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-foreground leading-none">{seller.shop_name}</p>
                            <p className="text-[9px] text-muted-foreground leading-none mt-1">{user?.email}</p>
                        </div>
                        <Avatar className="h-7 w-7 rounded-lg border border-primary/10">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/5 text-primary text-[9px] font-black">{seller.shop_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8F9FA] hide-scrollbar">
                
                {/* DASHBOARD CONTENT */}
                <TabsContent value="dashboard" className="m-0 space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Revenue" value={`GHS ${formatPrice(totalRevenue).replace('GHS ', '')}`} icon={DollarSign} subText="Life-time earnings" />
                        <StatCard title="Active Listings" value={products.length} icon={Box} subText="Live on marketplace" />
                        <StatCard title="Orders Processed" value={orders.length} icon={ShoppingBag} />
                        <StatCard title="Shop Status" value={seller.is_open ? 'ONLINE' : 'OFFLINE'} icon={seller.is_open ? Store : Clock} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-white border-b px-5 py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest">Recent Orders</CardTitle>
                                <Button variant="link" className="text-primary text-[9px] font-black uppercase p-0 h-auto">View Registry</Button>
                            </CardHeader>
                            <div className="bg-white overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow>
                                            <TableHead className="text-[8px] font-black uppercase px-5 h-8">Registry ID</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase h-8">Commodity</TableHead>
                                            <TableHead className="text-[8px] font-black uppercase text-right px-5 h-8">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.slice(0, 5).map(order => (
                                            <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                                                <TableCell className="text-[10px] font-mono px-5 py-3">#{order.id.substring(0, 6)}</TableCell>
                                                <TableCell className="text-[10px] font-bold truncate max-w-[100px] py-3">{order.products?.name || order.vendor_products?.name}</TableCell>
                                                <TableCell className="text-right px-5 py-3">
                                                    <Badge className="text-[7px] h-3.5 px-1.5 uppercase font-black" variant={order.status === 'completed' ? 'default' : 'outline'}>{order.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                             <CardHeader className="bg-white border-b px-5 py-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest">Market Logs</CardTitle>
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                {orders.length === 0 ? (
                                    <div className="text-center py-10 opacity-30 flex flex-col items-center">
                                        <Package className="h-8 w-8 mb-2" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">Logs empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {orders.slice(0, 4).map(o => (
                                            <div key={o.id} className="flex gap-3 items-center">
                                                <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold truncate">Acquisition by {o.profiles?.display_name || 'Buyer'}</p>
                                                    <p className="text-[8px] text-muted-foreground">Amount: GHS {o.price_per_item * o.quantity}</p>
                                                </div>
                                                <span className="text-[8px] font-bold text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* INVENTORY / PRODUCTS CONTENT */}
                <TabsContent value="products" className="m-0 space-y-6 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <div>
                            <h1 className="text-xl font-black italic uppercase tracking-tighter text-foreground leading-none">Catalog Management</h1>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Oversee your digital commodity inventory.</p>
                        </div>
                        
                        <AddProductDialog onPublishSuccess={fetchData} />
                    </div>

                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <div className="bg-white p-3 border-b">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input 
                                    placeholder="Refine results..." 
                                    className="pl-8 h-8 text-[10px] bg-muted/30 border-none rounded-lg" 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow>
                                        <TableHead className="text-[8px] font-black uppercase px-5 h-8">Commodity</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase h-8">Valuation</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase h-8">Stock Level</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-right px-5 h-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(p => (
                                        <TableRow key={p.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative h-8 w-8 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                                                        {p.image_urls?.[0] ? <Image src={p.image_urls[0]} alt="" fill className="object-cover" /> : <ImageIcon className="p-2 text-muted-foreground/30 h-4 w-4 mx-auto mt-1" />}
                                                    </div>
                                                    <span className="text-[11px] font-black truncate max-w-[150px]">{p.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[11px] font-black text-foreground">GHS {p.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold">{p.quantity || 0} Units</span>
                                                    <Badge className="text-[6px] font-black h-3 uppercase px-1 w-fit" variant={(p.quantity || 0) > 0 ? 'secondary' : 'destructive'}>
                                                        {(p.quantity || 0) > 0 ? 'Active' : 'Out of Stock'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-5 py-3">
                                                <div className="flex justify-end gap-0.5">
                                                    <EditProductDialog product={p} onUpdateSuccess={fetchData} />
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5" onClick={() => handleDeleteProduct(p.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic text-[11px]">No matching commodities found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* ORDERS TAB */}
                <TabsContent value="orders" className="m-0 animate-in fade-in duration-500">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-white border-b px-5 py-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest">Order Registry</CardTitle>
                             <div className="relative w-full max-w-[200px]">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input 
                                    placeholder="Filter registry..." 
                                    className="pl-7 h-7 text-[9px] bg-muted/30 border-none rounded-lg" 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <div className="bg-white overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow>
                                        <TableHead className="text-[8px] font-black uppercase px-5 h-8">Buyer & Location</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase h-8">Item</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase h-8">Total</TableHead>
                                        <TableHead className="text-[8px] font-black uppercase text-right px-5 h-8">Process</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map(o => (
                                        <TableRow key={o.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="px-5 py-3">
                                                <div className="space-y-1">
                                                    <div>
                                                        <p className="text-[10px] font-black leading-none">{o.profiles?.display_name}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground mt-0.5">{o.profiles?.phone_number}</p>
                                                    </div>
                                                    {o.delivery_location && (
                                                        <div className="flex items-center gap-1 text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md w-fit uppercase tracking-tighter">
                                                            <MapPin className="h-2.5 w-2.5" /> {o.delivery_location}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[10px] font-bold max-w-[120px] truncate">{o.products?.name || o.vendor_products?.name}</TableCell>
                                            <TableCell className="text-[10px] font-black">GHS {o.price_per_item * o.quantity}</TableCell>
                                            <TableCell className="text-right px-5 py-3">
                                                <div className="flex justify-end gap-1.5">
                                                    {o.status === 'pending' && <Button size="sm" className="h-6 text-[7px] font-black uppercase px-2 rounded-md" onClick={() => handleUpdateStatus(o.id, 'ready')}>Approve</Button>}
                                                    {o.status === 'ready' && <Button size="sm" className="h-6 text-[7px] font-black uppercase px-2 rounded-md bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => handleUpdateStatus(o.id, 'completed')}>Finalize</Button>}
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild><Link href={`/admin/sales/${o.id}`}><Eye className="h-3 w-3" /></Link></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic text-[11px]">No matching records found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* CUSTOMERS TAB */}
                <TabsContent value="clients" className="m-0 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uniqueCustomers.map((cust: any) => (
                            <Card key={cust.id} className="border-none shadow-sm rounded-3xl p-4 bg-white flex items-center gap-3 group hover:shadow-md transition-all">
                                <Avatar className="h-10 w-10 border border-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">{cust.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-xs truncate uppercase tracking-tight">{cust.name}</h3>
                                    <p className="text-[9px] font-bold text-muted-foreground">{cust.phone}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" asChild>
                                    <a href={`tel:${cust.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                                </Button>
                            </Card>
                        ))}
                        {uniqueCustomers.length === 0 && (
                            <div className="col-span-full py-20 text-center text-muted-foreground opacity-30 flex flex-col items-center">
                                <Users className="h-10 w-10 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No customer data available</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="m-0 animate-in fade-in duration-500">
                    <div className="max-w-xl mx-auto space-y-6">
                        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                            <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                                <CardTitle className="text-sm font-black uppercase tracking-[2px]">Identity Synchronizer</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <form action={handleUpdateShop} className="space-y-6">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <Avatar className="h-20 w-20 border-[4px] border-white shadow-xl ring-1 ring-primary/10">
                                                <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url} className="object-cover" />
                                                <AvatarFallback className="text-2xl font-black">{seller.shop_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="logo_settings" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                                <UploadCloud className="text-white h-6 w-6" />
                                            </Label>
                                            <Input id="logo_settings" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Modify Identity</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="shop_name_s" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Store Nomenclature</Label>
                                            <Input id="shop_name_s" name="shop_name" defaultValue={seller.shop_name} required className="h-11 border-2 rounded-xl text-sm font-bold bg-muted/20" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="desc_s" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Business Bio</Label>
                                            <Textarea id="desc_s" name="description" defaultValue={seller.description || ''} placeholder="Describe your shop..." className="min-h-[100px] border-2 rounded-xl text-xs bg-muted/20 resize-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-1.5">
                                                <Label className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Open</Label>
                                                <Input name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-11 border-2 rounded-xl bg-muted/20 text-xs" />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Close</Label>
                                                <Input name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-11 border-2 rounded-xl bg-muted/20 text-xs" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full h-12 text-[10px] font-black uppercase tracking-[2px] rounded-xl shadow-xl shadow-primary/10" disabled={isUpdatePending}>
                                        {isUpdatePending ? <Loader2 className="animate-spin h-4 w-4 mr-3" /> : 'Synchronize Profile'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </main>
        </div>
      </Tabs>
    </div>
  );
}
