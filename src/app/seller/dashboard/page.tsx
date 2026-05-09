'use client';

import { useEffect, useState, useTransition, useActionState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleShopStatus, addSellerProduct, updateShopInfo, updateSellerProduct, deleteSellerOrder } from '../actions';
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
    MapPin,
    StickyNote,
    Check,
    X
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
                <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[1.5px] text-[11px] rounded-xl px-5 h-11 border-none shadow-lg shadow-orange-500/10 font-poppins">
                    <Plus className="h-4 w-4 mr-2" /> Publish Item
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[650px] p-0 overflow-hidden rounded-[32px] flex flex-col max-h-[90vh] border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-white uppercase font-montserrat">New Listing</DialogTitle>
                        <DialogDescription className="text-primary-foreground/90 text-sm font-medium font-inter">
                            Publish a product to your digital storefront.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <form action={action} className="flex flex-col flex-1 overflow-hidden bg-background">
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 hide-scrollbar">
                        <div className="grid gap-2">
                            <Label htmlFor="name_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Item Name</Label>
                            <Input id="name_add" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. MacBook Pro M3" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-inter" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="price_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Price (GHS)</Label>
                                <Input id="price_add" name="price" type="number" step="0.01" placeholder="0.00" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-roboto" />
                            </div>
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="quantity_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Stock Units</Label>
                                <Input id="quantity_add" name="quantity" type="number" min="0" placeholder="1" defaultValue="1" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-roboto" />
                            </div>
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="category_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Category</Label>
                                <Select name="category" required onValueChange={setUploadCategory}>
                                    <SelectTrigger className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-inter">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl font-inter">
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Description</Label>
                                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase rounded-full border-primary/20 text-primary font-poppins" onClick={handleGenerateDescription} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI Assistant
                                </Button>
                            </div>
                            <Textarea id="description_add" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-muted/30 border-2 text-sm md:text-base rounded-xl resize-none font-inter" />
                        </div>

                        <div className="p-5 md:p-6 bg-muted/20 rounded-2xl border-2 border-dashed space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <Label htmlFor="offers_delivery_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Offer Delivery</Label>
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
                                        <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Pricing Model</Label>
                                        <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all font-inter">
                                                <RadioGroupItem value="fixed" id="fixed_add" />
                                                <Label htmlFor="fixed_add" className="text-sm font-bold cursor-pointer">Fixed Fee</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all font-inter">
                                                <RadioGroupItem value="location_based" id="location_based_add" />
                                                <Label htmlFor="location_based_add" className="text-sm font-bold cursor-pointer">Location Based</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {deliveryPriceType === 'fixed' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_price_add" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Delivery Fee (GHS)</Label>
                                            <Input id="delivery_price_add" name="delivery_price" type="number" step="0.01" placeholder="0.00" className="bg-background border-2 h-11 text-sm rounded-xl font-roboto" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Product Media</Label>
                            <Input id="image_add" name="image" type="file" accept="image/*" required onChange={handleImageChange} className="bg-muted/30 border-2 h-14 text-xs rounded-xl pt-4 cursor-pointer file:font-bold file:text-primary font-poppins" />
                            {imagePreview && (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner group">
                                    <Image src={imagePreview} alt="" fill className="object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6 border-t bg-background flex-shrink-0">
                        <Button type="submit" className="w-full h-14 text-base font-black uppercase tracking-[2px] shadow-2xl shadow-primary/20 rounded-2xl font-poppins" disabled={isPending}>
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
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-all">
                    <Edit className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[650px] p-0 overflow-hidden rounded-[32px] flex flex-col max-h-[90vh] border-none shadow-2xl">
                <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black tracking-tight text-white font-montserrat uppercase">Edit Listing</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 text-sm font-inter">
                            Modify your product details and availability.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <form action={action} className="flex flex-col flex-1 overflow-hidden bg-background">
                    <input type="hidden" name="id" value={product.id} />
                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 hide-scrollbar">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Product Name</Label>
                            <Input id="name" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-inter" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Price (GHS)</Label>
                                <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-roboto" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Units In Stock</Label>
                                <Input id="quantity" name="quantity" type="number" min="0" defaultValue={product.quantity || 1} required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-roboto" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Category</Label>
                                <Select name="category" defaultValue={categories.includes(product.category) ? product.category : 'Other'} required onValueChange={setUploadCategory}>
                                    <SelectTrigger className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-inter">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl font-inter">
                                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {uploadCategory === 'Other' && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label htmlFor="custom_category" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Custom Category Name</Label>
                                <Input id="custom_category" name="custom_category" defaultValue={!categories.includes(product.category) ? product.category : ''} placeholder="Custom category" required className="bg-muted/30 border-2 h-12 text-sm md:text-base rounded-xl font-inter" />
                            </div>
                        )}

                        <div className="p-5 md:p-6 bg-muted/20 rounded-2xl border-2 border-dashed space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <Label htmlFor="offers_delivery_edit" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Offer Delivery</Label>
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
                                        <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Pricing Model</Label>
                                        <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex flex-col sm:flex-row gap-4">
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all font-inter">
                                                <RadioGroupItem value="fixed" id="fixed_edit" />
                                                <Label htmlFor="fixed_edit" className="text-sm font-bold cursor-pointer">Fixed Fee</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border-2 flex-1 cursor-pointer hover:border-primary/30 transition-all font-inter">
                                                <RadioGroupItem value="location_based" id="location_based_edit" />
                                                <Label htmlFor="location_based_edit" className="text-sm font-bold cursor-pointer">Based on Location</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {deliveryPriceType === 'fixed' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_price_edit" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Delivery Fee (GHS)</Label>
                                            <Input id="delivery_price_edit" name="delivery_price" type="number" step="0.01" defaultValue={product.delivery_price || 0} className="bg-background border-2 h-11 text-sm rounded-xl font-roboto" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Detailed Description</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-1.5 px-3 text-[10px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 rounded-full font-poppins"
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
                                className="bg-muted/30 border-2 text-sm md:text-base rounded-xl resize-none font-inter" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Update Image (Optional)</Label>
                            <div className="flex flex-col gap-4">
                                <Input 
                                    id="image" 
                                    name="image" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="bg-muted/30 border-2 h-14 text-xs rounded-xl cursor-pointer pt-5 font-poppins"
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
                        <Button type="submit" className="w-full h-14 text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-2xl font-poppins" disabled={isPending}>
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
              .select('*, products:product_id(name, image_urls, offers_delivery), vendor_products:vendor_product_id(name, image_urls, offers_delivery), profiles:buyer_id(display_name, phone_number, id)')
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
            toast({ title: status === 'cancelled' ? 'Order Declined' : 'Order Status Updated', variant: 'success' });
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order record? This action cannot be undone.')) return;
    
    startTransition(async () => {
        const result = await deleteSellerOrder(orderId);
        if (result.success) {
            setOrders(orders.filter(o => o.id !== orderId));
            toast({ title: 'Order Record Deleted', variant: 'success' });
        } else {
            toast({ title: 'Delete failed', description: result.error, variant: 'destructive' });
        }
    });
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
                description: 'Changes applied. Please refresh the page manually to update all profile icons across the site.',
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

  const unattendedCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

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

  const handleBellClick = () => {
      if (unattendedCount > 0) {
          toast({
              title: 'Pending Action',
              description: `You have ${unattendedCount} unattended order(s). Check the Registry.`,
          });
      } else {
          toast({
              title: 'All Clear',
              description: 'No pending orders at the moment.',
          });
      }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  if (!seller) return <div className="p-8 text-center h-screen flex items-center justify-center flex-col"><p className="text-muted-foreground text-sm font-poppins">Seller profile not found.</p><Button asChild variant="outline" className="mt-4 rounded-xl"><Link href="/">Return Home</Link></Button></div>;

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
  
  const StatCard = ({ title, value, icon: Icon, subText }: { title: string, value: string | number, icon: any, subText?: string }) => (
      <Card className="bg-white border-none shadow-sm rounded-2xl p-4 md:p-5 relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
              <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground font-poppins">{title}</p>
                  <h3 className="text-xl md:text-2xl font-black text-foreground font-montserrat">{value}</h3>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
              </div>
          </div>
          {subText && (
              <p className="text-[11px] font-bold text-muted-foreground mt-3 flex items-center gap-1.5 uppercase tracking-tighter font-inter">
                  {subText}
              </p>
          )}
      </Card>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row w-full overflow-hidden font-inter">
      
      <Tabs defaultValue="dashboard" className="w-full flex flex-col md:flex-row h-screen overflow-hidden">
        
        <aside className="hidden md:flex w-[250px] bg-primary flex-col flex-shrink-0">
            <div className="p-8">
                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter font-montserrat">Seller Hub</h2>
            </div>
            
            <div className="flex-1 px-4">
                <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                    <TabsTrigger value="dashboard" className="w-full justify-start gap-4 rounded-xl py-3.5 px-5 text-white/70 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="products" className="w-full justify-start gap-4 rounded-xl py-3.5 px-5 text-white/70 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">
                        <Box className="h-5 w-5" /> Inventory
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="w-full justify-start gap-4 rounded-xl py-3.5 px-5 text-white/70 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">
                        <ShoppingBasket className="h-5 w-5" /> Orders
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="w-full justify-start gap-4 rounded-xl py-3.5 px-5 text-white/70 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">
                        <Users className="h-5 w-5" /> Customers
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="w-full justify-start gap-4 rounded-xl py-3.5 px-5 text-white/70 font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">
                        <Settings className="h-5 w-5" /> Settings
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="p-6 mt-auto space-y-4">
                <div className="bg-white/10 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="shop-toggle-sidebar" className="text-[11px] font-black text-white uppercase tracking-widest cursor-pointer font-poppins">Shop Status</Label>
                        <Switch 
                            id="shop-toggle-sidebar" 
                            checked={seller.is_open} 
                            onCheckedChange={handleToggle}
                            disabled={isPending}
                            className="scale-90 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", seller.is_open ? "bg-emerald-400" : "bg-red-400")} />
                        <span className="text-[11px] font-black text-white/70 uppercase tracking-tighter font-poppins">
                            {seller.is_open ? "Accepting Orders" : "Currently Closed"}
                        </span>
                    </div>
                </div>

                <Button asChild variant="destructive" className="w-full justify-start gap-4 h-11 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-red-900/20 bg-red-600 hover:bg-red-700 font-poppins rounded-xl">
                    <Link href="/">
                        <Home className="h-5 w-5" /> Exit Store
                    </Link>
                </Button>
            </div>
        </aside>

        <div className="md:hidden bg-primary p-4 flex items-center justify-between shadow-lg z-50">
             <h2 className="text-white text-xl font-black italic uppercase tracking-tighter font-montserrat">Seller Hub</h2>
             <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" onClick={handleSync} disabled={isPending} className="text-white h-10 w-10">
                    <RefreshCw className={cn("h-5 w-5", isPending && "animate-spin")} />
                 </Button>
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white h-10 w-10">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] p-0 bg-primary border-none">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </SheetHeader>
                         <div className="p-8">
                            <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter font-montserrat">Seller Hub</h2>
                        </div>
                        <div className="flex-1 px-4">
                             <TabsList className="flex flex-col h-auto bg-transparent gap-2 w-full">
                                <SheetClose asChild><TabsTrigger value="dashboard" className="w-full justify-start gap-4 rounded-xl py-4 px-6 text-white/70 font-black uppercase text-[12px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">Dashboard</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="products" className="w-full justify-start gap-4 rounded-xl py-4 px-6 text-white/70 font-black uppercase text-[12px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">Inventory</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="orders" className="w-full justify-start gap-4 rounded-xl py-4 px-6 text-white/70 font-black uppercase text-[12px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">Orders</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="clients" className="w-full justify-start gap-4 rounded-xl py-4 px-6 text-white/70 font-black uppercase text-[12px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">Customers</TabsTrigger></SheetClose>
                                <SheetClose asChild><TabsTrigger value="settings" className="w-full justify-start gap-4 rounded-xl py-4 px-6 text-white/70 font-black uppercase text-[12px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary transition-all font-poppins">Settings</TabsTrigger></SheetClose>
                            </TabsList>
                        </div>
                    </SheetContent>
                 </Sheet>
             </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="hidden md:flex h-16 bg-white border-b items-center px-10 justify-between flex-shrink-0">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search records..." 
                        className="pl-11 h-11 border-none bg-muted/30 focus-visible:ring-primary/10 rounded-xl text-[13px] font-inter" 
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={handleSync} disabled={isPending} className="text-muted-foreground h-9 w-9 rounded-full">
                        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </Button>
                    <Button onClick={handleBellClick} variant="ghost" size="icon" className="text-muted-foreground h-9 w-9 rounded-full relative">
                        <Bell className="h-4 w-4" />
                        {unattendedCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                                {unattendedCount}
                            </span>
                        )}
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-3.5">
                         <div className="text-right">
                            <p className="text-[12px] font-black text-foreground leading-none font-poppins uppercase tracking-tighter">{seller.shop_name}</p>
                            <p className="text-[10px] text-muted-foreground leading-none mt-1 font-roboto uppercase">{user?.email}</p>
                        </div>
                        <Avatar className="h-10 w-10 rounded-xl border border-primary/10 bg-white">
                            <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary text-[11px] font-black">{seller.shop_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8F9FA] hide-scrollbar">
                
                <TabsContent value="dashboard" className="m-0 space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard title="Liquidity" value={`GHS ${formatPrice(totalRevenue).replace('GHS ', '')}`} icon={DollarSign} subText="Life-time earnings" />
                        <StatCard title="Inventory" value={products.length} icon={Box} subText="Live marketplace items" />
                        <StatCard title="Logistics" value={orders.length} icon={ShoppingBag} subText="Orders in pipeline" />
                        <StatCard title="Protocol" value={seller.is_open ? 'ONLINE' : 'OFFLINE'} icon={seller.is_open ? Store : Clock} subText="Operational status" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                            <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground font-poppins">Order Registry</CardTitle>
                                <Button variant="link" className="text-primary text-[11px] font-black uppercase p-0 h-auto font-poppins">Full Log</Button>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-[11px] font-black uppercase px-6 h-10 font-poppins">ID</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase h-10 font-poppins">Commodity</TableHead>
                                            <TableHead className="text-[11px] font-black uppercase text-right px-6 h-10 font-poppins">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.slice(0, 5).map(order => {
                                            const isAccepted = order.status === 'ready' || order.status === 'completed';
                                            const isDeclined = order.status === 'cancelled';
                                            return (
                                                <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-none">
                                                    <TableCell className="text-[12px] font-mono px-6 py-4">#{order.id.substring(0, 6)}</TableCell>
                                                    <TableCell className="text-[13px] font-bold truncate max-w-[120px] py-4 font-inter">{order.products?.name || order.vendor_products?.name}</TableCell>
                                                    <TableCell className="text-right px-6 py-4">
                                                        <Badge 
                                                            className="text-[10px] h-5 px-2 uppercase font-black tracking-widest font-poppins" 
                                                            variant={order.status === 'completed' ? 'default' : isDeclined ? 'destructive' : isAccepted ? 'secondary' : 'outline'}
                                                        >
                                                            {order.status === 'ready' ? 'Accepted' : order.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                             <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground font-poppins">Market Activity</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                {orders.length === 0 ? (
                                    <div className="text-center py-12 opacity-30 flex flex-col items-center">
                                        <Package className="h-10 w-10 mb-3" />
                                        <p className="text-[11px] font-black uppercase tracking-widest font-poppins">Logs empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.slice(0, 4).map(o => (
                                            <div key={o.id} className="flex gap-4 items-center">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <DollarSign className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold truncate font-inter">Purchase by {o.profiles?.display_name || 'Buyer'}</p>
                                                    <p className="text-[11px] text-muted-foreground font-roboto">GHS {(o.price_per_item * o.quantity).toFixed(2)}</p>
                                                </div>
                                                <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap font-roboto">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="products" className="m-0 space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                        <div>
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none font-montserrat">Commodity Control</h1>
                            <p className="text-[11px] text-muted-foreground font-bold mt-2 uppercase tracking-[2px] font-poppins">Manage your digital marketplace inventory.</p>
                        </div>
                        
                        <AddProductDialog onPublishSuccess={fetchData} />
                    </div>

                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <div className="bg-white p-5 border-b">
                            <div className="relative w-full max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Filter catalog..." 
                                    className="pl-11 h-11 text-[13px] bg-muted/30 border-none rounded-xl font-inter" 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="bg-white overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] font-black uppercase px-6 h-12 font-poppins">Commodity</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase h-12 font-poppins">Valuation</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase h-12 font-poppins">Stock Level</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase text-right px-6 h-12 font-poppins">Management</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map(p => (
                                        <TableRow key={p.id} className="hover:bg-muted/5 transition-colors border-none">
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 rounded-xl bg-muted overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                                        {p.image_urls?.[0] ? <Image src={p.image_urls[0]} alt="" fill className="object-cover" /> : <ImageIcon className="p-3 text-muted-foreground/30 h-6 w-6 mx-auto mt-1" />}
                                                    </div>
                                                    <span className="text-[14px] font-bold truncate max-w-[200px] font-inter">{p.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[14px] font-black text-foreground font-roboto">GHS {p.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[13px] font-bold font-inter">{p.quantity || 0} Units</span>
                                                    <Badge className="text-[10px] font-black h-5 px-2 uppercase tracking-widest w-fit font-poppins" variant={(p.quantity || 0) > 0 ? 'secondary' : 'destructive'}>
                                                        {(p.quantity || 0) > 0 ? 'Active' : 'Empty'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <EditProductDialog product={p} onUpdateSuccess={fetchData} />
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl transition-all" onClick={() => handleDeleteProduct(p.id)}>
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic text-sm font-inter">No commodities in this sector.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="m-0 animate-in fade-in duration-500">
                    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                        <CardHeader className="bg-white border-b px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground font-poppins">Order Pipeline</CardTitle>
                             <div className="relative w-full max-w-[300px] group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Search order ID or buyer..." 
                                    className="pl-10 h-10 text-[13px] bg-muted/30 border-none rounded-xl font-inter" 
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <div className="bg-white overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] font-black uppercase px-6 h-12 font-poppins">Buyer Profile</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase h-12 font-poppins">Commodity Detail</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase h-12 font-poppins">Lifecycle Phase</TableHead>
                                        <TableHead className="text-[11px] font-black uppercase text-right px-6 h-12 font-poppins">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map(o => {
                                        const prod = o.products || o.vendor_products;
                                        const isDelivery = prod?.offers_delivery;
                                        return (
                                            <TableRow key={o.id} className="hover:bg-muted/5 transition-colors align-top border-none">
                                                <TableCell className="px-6 py-6">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-[14px] font-black leading-tight font-inter">{o.profiles?.display_name}</p>
                                                            <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-wider font-roboto uppercase">{o.profiles?.phone_number}</p>
                                                        </div>
                                                        {o.delivery_location && (
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg w-fit uppercase tracking-tighter mt-2 font-poppins">
                                                                <MapPin className="h-3.5 w-3.5" /> {o.delivery_location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-6">
                                                    <div className="space-y-3">
                                                        <p className="text-[13px] font-bold max-w-[200px] truncate font-inter">{prod?.name}</p>
                                                        {o.notes && (
                                                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl max-w-[250px] shadow-sm">
                                                                <div className="flex items-center gap-2 mb-1.5 opacity-70">
                                                                    <StickyNote className="h-3 w-3 text-amber-800" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 font-poppins">Special Request</span>
                                                                </div>
                                                                <p className="text-[11px] text-amber-800 leading-relaxed italic font-inter">&ldquo;{o.notes}&rdquo;</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col gap-2">
                                                        {o.status === 'pending' && <Badge variant="outline" className="text-[11px] h-6 px-3 uppercase font-black bg-blue-50 text-blue-700 border-blue-200 font-poppins tracking-widest">New Order</Badge>}
                                                        {o.status === 'ready' && (
                                                            <Badge variant="secondary" className="text-[11px] h-6 px-3 uppercase font-black bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-2 w-fit font-poppins tracking-widest">
                                                                {isDelivery ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                                                                {isDelivery ? 'Pending Delivery' : 'Awaiting Collection'}
                                                            </Badge>
                                                        )}
                                                        {o.status === 'completed' && <Badge variant="default" className="text-[11px] h-6 px-3 uppercase font-black bg-emerald-600 text-white border-none font-poppins tracking-widest">Successful</Badge>}
                                                        {o.status === 'cancelled' && <Badge variant="destructive" className="text-[11px] h-6 px-3 uppercase font-black font-poppins tracking-widest">Declined</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6 py-6">
                                                    <div className="flex justify-end gap-3">
                                                        {o.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="h-10 text-[11px] font-black uppercase px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/10 font-poppins tracking-widest" 
                                                                    onClick={() => handleUpdateStatus(o.id, 'ready')}
                                                                >
                                                                    Accept
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-10 text-[11px] font-black uppercase px-6 text-destructive hover:bg-destructive/10 rounded-xl border-2 border-destructive/10 font-poppins tracking-widest" 
                                                                    onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                                                                >
                                                                    Decline
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {o.status === 'ready' && (
                                                            <Button 
                                                                size="sm" 
                                                                className="h-10 text-[11px] font-black uppercase px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-poppins tracking-widest" 
                                                                onClick={() => handleUpdateStatus(o.id, 'completed')}
                                                            >
                                                                {isDelivery ? 'Mark Delivered' : 'Confirm Collection'}
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" asChild><Link href={`/admin/sales/${o.id}`}><Eye className="h-5 w-5" /></Link></Button>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl transition-all" onClick={() => handleDeleteOrder(o.id)}>
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-32 text-muted-foreground italic text-[14px] font-inter">No marketplace transactions found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="clients" className="m-0 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {uniqueCustomers.map((cust: any) => (
                            <Card key={cust.id} className="border-none shadow-sm rounded-[32px] p-6 bg-white flex items-center gap-5 group hover:shadow-xl hover:shadow-primary/5 transition-all">
                                <Avatar className="h-14 w-14 border-2 border-background shadow-lg ring-1 ring-primary/10">
                                    <AvatarFallback className="bg-primary/5 text-primary font-black text-lg font-montserrat">{cust.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-[15px] truncate uppercase tracking-tight font-montserrat">{cust.name}</h3>
                                    <p className="text-[11px] font-bold text-muted-foreground mt-1 tracking-widest font-roboto uppercase">{cust.phone}</p>
                                    <p className="text-[10px] font-black text-primary/70 uppercase mt-2 font-poppins">{cust.totalOrders} Completed Deals</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[20px] bg-muted/40 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" asChild>
                                    <a href={`tel:${cust.phone}`}><Phone className="h-5 w-5" /></a>
                                </Button>
                            </Card>
                        ))}
                        {uniqueCustomers.length === 0 && (
                            <div className="col-span-full py-40 text-center text-muted-foreground opacity-30 flex flex-col items-center">
                                <Users className="h-16 w-16 mb-4" />
                                <p className="text-sm font-black uppercase tracking-[3px] font-poppins">Customer database offline</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="m-0 animate-in fade-in duration-500">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
                            <CardHeader className="bg-muted/5 border-b p-8 md:p-10">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[3px] text-muted-foreground font-poppins">Digital Identity Management</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 md:p-12">
                                <form action={handleUpdateShop} className="space-y-10">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="h-32 w-32 border-[8px] border-white shadow-2xl ring-1 ring-primary/20">
                                                <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url} className="object-cover" />
                                                <AvatarFallback className="text-4xl font-black font-montserrat">{seller.shop_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="logo_settings" className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                                <UploadCloud className="text-white h-10 w-10" />
                                            </Label>
                                            <Input id="logo_settings" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-[4px] text-primary font-poppins">Modify Marketplace Branding</p>
                                            <p className="text-[11px] text-muted-foreground mt-2 font-medium uppercase tracking-widest font-poppins">Logo dimension optimal: 512x512</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid gap-2.5">
                                            <Label htmlFor="shop_name_s" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Enterprise Name</Label>
                                            <Input id="shop_name_s" name="shop_name" defaultValue={seller.shop_name} required className="h-14 border-2 rounded-2xl text-[15px] font-bold bg-muted/20 font-inter" />
                                        </div>
                                        <div className="grid gap-2.5">
                                            <Label htmlFor="desc_s" className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Store Biography</Label>
                                            <Textarea id="desc_s" name="description" defaultValue={seller.description || ''} placeholder="Tell customers about your shop..." className="min-h-[160px] border-2 rounded-2xl text-[14px] bg-muted/20 resize-none p-5 font-inter leading-relaxed" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="grid gap-2.5">
                                                <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Protocol Start</Label>
                                                <Input name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-14 border-2 rounded-2xl bg-muted/20 text-sm font-black font-roboto" />
                                            </div>
                                            <div className="grid gap-2.5">
                                                <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground font-poppins">Protocol End</Label>
                                                <Input name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-14 border-2 rounded-2xl bg-muted/20 text-sm font-black font-roboto" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full h-16 text-xs md:text-sm font-black uppercase tracking-[4px] rounded-2xl shadow-2xl shadow-primary/30 mt-6 font-poppins" disabled={isUpdatePending}>
                                        {isUpdatePending ? <Loader2 className="animate-spin h-5 w-5 mr-4" /> : 'Synchronize Identity'}
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