'use client';

import { useEffect, useState, useTransition, useActionState, useCallback } from 'react';
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
    CheckCircle,
    Store,
    RefreshCw,
    UploadCloud,
    ExternalLink,
    Menu,
    Home,
    LogOut,
    ArrowLeft,
    Heart,
    Edit,
    Sparkles,
    FileText,
    LayoutGrid,
    Truck,
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
import { logout } from '@/app/auth/actions';
import { generateProductDescription } from '@/ai/flows/ai-product-description-assistant';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

function EditProductDialog({ product, onUpdateSuccess }: { product: any, onUpdateSuccess: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [uploadCategory, setUploadCategory] = useState(categories.includes(product.category) ? product.category : 'Other');
    const [imagePreview, setImagePreview] = useState<string | null>(product.image_urls?.[0] || null);
    
    const [productName, setProductName] = useState(product.name || '');
    const [description, setDescription] = useState(product.description?.replace(' (AI Enhanced)', '') || '');
    const [isGenerating, startGeneratingTransition] = useTransition();

    // Delivery states
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
                <Button variant="outline" size="sm" className="w-full mt-3 h-8 md:h-9 rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest border-2 hover:bg-primary hover:text-white transition-all">
                    <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-[550px] p-0 overflow-hidden rounded-3xl flex flex-col max-h-[80vh] border-none shadow-2xl">
                <div className="bg-primary p-5 md:p-6 text-primary-foreground flex-shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl md:text-2xl font-black tracking-tight text-white">Edit Listing</DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 text-xs md:text-sm">
                            Modify your product details and availability.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <form action={action} className="flex flex-col flex-1 overflow-hidden bg-background">
                    <input type="hidden" name="id" value={product.id} />
                    <div className="flex-1 overflow-y-auto px-5 md:px-8 py-4 space-y-5 hide-scrollbar">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Name</Label>
                            <Input id="name" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Selling Price (GHS)</Label>
                                <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                <Select name="category" defaultValue={categories.includes(product.category) ? product.category : 'Other'} required onValueChange={setUploadCategory}>
                                    <SelectTrigger className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl">
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
                                <Input id="custom_category" name="custom_category" defaultValue={!categories.includes(product.category) ? product.category : ''} placeholder="Custom category" required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                            </div>
                        )}

                        <div className="p-4 bg-muted/20 rounded-2xl border-2 border-dashed space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <Label htmlFor="offers_delivery" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Offer Delivery</Label>
                                </div>
                                <Switch 
                                    id="offers_delivery" 
                                    name="offers_delivery" 
                                    checked={offersDelivery} 
                                    onCheckedChange={setOffersDelivery} 
                                />
                            </div>

                            {offersDelivery && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid gap-2">
                                        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Pricing Model</Label>
                                        <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="fixed" id="fixed" />
                                                <Label htmlFor="fixed" className="text-xs font-bold">Fixed Fee</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="location_based" id="location_based" />
                                                <Label htmlFor="location_based" className="text-xs font-bold">Based on Location</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    {deliveryPriceType === 'fixed' && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery_price" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Fee (GHS)</Label>
                                            <Input id="delivery_price" name="delivery_price" type="number" step="0.01" defaultValue={product.delivery_price || 0} className="bg-background border-2 h-10 text-sm rounded-lg" />
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
                                    className="h-7 gap-1 px-3 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 rounded-full"
                                    onClick={handleGenerateDescription}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    AI Rewrite
                                </Button>
                            </div>
                            <Textarea 
                                id="description" 
                                name="description" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3} 
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
                                    className="bg-muted/30 border-2 h-11 text-xs rounded-xl cursor-pointer pt-3"
                                />
                                {imagePreview && (
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner">
                                        <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 md:p-6 border-t bg-background flex-shrink-0">
                        <Button type="submit" className="w-full h-12 md:h-14 text-sm md:text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl" disabled={isPending}>
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
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [uploadCategory, setUploadCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Add product delivery states
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryPriceType, setDeliveryPriceType] = useState('fixed');

  const { toast } = useToast();

  const [addState, addAction, isAddPending] = useActionState(addSellerProduct, { success: false, error: null });

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

  useEffect(() => {
    if (addState.success) {
        setIsAddDialogOpen(false);
        setProductImagePreview(null);
        setUploadCategory('');
        setProductName('');
        setDescription('');
        setOffersDelivery(false);
        setDeliveryPriceType('fixed');
        toast({ variant: 'success', title: 'Listing Published!', description: 'Your product is now live in your shop.' });
        fetchData();
        router.refresh();
    } else if (addState.error) {
        toast({ title: 'Listing Failed', description: addState.error, variant: 'destructive' });
    }
  }, [addState, toast, router, fetchData]);

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

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImagePreview(URL.createObjectURL(file));
    } else {
      setProductImagePreview(null);
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

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  if (!seller) return <div className="p-8 text-center h-screen flex items-center justify-center flex-col"><p className="text-muted-foreground">Seller profile not found.</p><Button asChild variant="outline" className="mt-4"><Link href="/">Return Home</Link></Button></div>;

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price_per_item * o.quantity), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'ready').length;
  
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.profiles?.id))).filter(Boolean).map(id => {
      const order = orders.find(o => o.profiles?.id === id);
      const customerOrders = orders.filter(o => o.profiles?.id === id);
      return {
          id,
          name: order?.profiles?.display_name || 'Anonymous',
          phone: order?.profiles?.phone_number || 'No Phone',
          totalOrders: customerOrders.length
      };
  });

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col w-full pb-20 md:pb-10">
      
      {/* 1. Shop Header Card (Compact Dashboard) */}
      <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          <div className="bg-[#1A1A1A] rounded-[24px] p-5 md:p-6 text-white shadow-2xl overflow-hidden relative mb-6 ring-1 ring-white/5">
              {/* Decorative Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
                  <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                          <Avatar className="h-14 w-14 md:h-16 md:w-20 rounded-[18px] border-2 border-white/10 bg-[#2A2A2A] shadow-inner">
                              <AvatarImage src={user?.user_metadata?.avatar_url} className="rounded-[18px] object-cover" />
                              <AvatarFallback className="rounded-[18px] bg-primary/10 text-primary font-black text-lg">
                                  {seller.shop_name?.charAt(0)}
                              </AvatarFallback>
                          </Avatar>
                          <div className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-[#1A1A1A]", seller.is_open ? "bg-emerald-500" : "bg-destructive")} />
                      </div>
                      <div className="min-w-0">
                          <h1 className="text-lg md:text-xl font-black tracking-tight truncate">{seller.shop_name}</h1>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 text-[8px] font-black uppercase tracking-[1.2px] px-2 py-0.5 rounded-full">
                                ✦ Verified Vendor
                            </Badge>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleSync} 
                        disabled={isPending}
                        className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                    >
                        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </Button>
                    
                    <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-[16px] border border-white/5 shadow-inner">
                        <Label htmlFor="shop-toggle-main" className={cn("text-[8px] font-black uppercase tracking-[1.2px]", seller.is_open ? "text-emerald-400" : "text-destructive/80")}>
                            {seller.is_open ? 'OPEN' : 'CLOSED'}
                        </Label>
                        <Switch 
                            id="shop-toggle-main" 
                            checked={seller.is_open} 
                            onCheckedChange={(checked) => handleToggle(checked)}
                            disabled={isPending}
                            className="data-[state=checked]:bg-emerald-500 scale-[0.8]"
                        />
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                          <Button className="h-10 rounded-[16px] bg-[#F5A623] hover:bg-[#E89512] text-black font-black uppercase tracking-[1.2px] text-[10px] shadow-xl shadow-orange-500/10 transition-all active:scale-95 border-none">
                              <Plus className="h-3.5 w-3.5 mr-1.5 stroke-[3px]" /> List Item
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95%] max-w-[550px] p-0 overflow-hidden rounded-[28px] flex flex-col max-h-[85vh] border-none shadow-2xl">
                        <div className="bg-primary p-5 text-primary-foreground flex-shrink-0">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">New Listing</DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 text-[10px] font-medium">
                                    Publish a product to your digital storefront.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form action={addAction} className="flex flex-col flex-1 overflow-hidden bg-background">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 hide-scrollbar">
                                <div className="grid gap-1">
                                    <Label htmlFor="name" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Item Name</Label>
                                    <Input id="name" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. MacBook Pro M3" required className="bg-muted/30 border-2 h-10 text-sm rounded-lg" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1">
                                        <Label htmlFor="price" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Price (GHS)</Label>
                                        <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required className="bg-muted/30 border-2 h-10 text-sm rounded-lg" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="category" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                        <Select name="category" required onValueChange={setUploadCategory}>
                                            <SelectTrigger className="bg-muted/30 border-2 h-10 text-sm rounded-lg">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {uploadCategory === 'Other' && (
                                    <div className="grid gap-1">
                                        <Label htmlFor="custom_category" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Custom Category</Label>
                                        <Input id="custom_category" name="custom_category" placeholder="Electronics" required className="bg-muted/30 border-2 h-10 text-sm rounded-lg" />
                                    </div>
                                )}

                                <div className="p-4 bg-muted/20 rounded-2xl border-2 border-dashed space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-primary" />
                                            <Label htmlFor="offers_delivery_add" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Offer Delivery</Label>
                                        </div>
                                        <Switch 
                                            id="offers_delivery_add" 
                                            name="offers_delivery" 
                                            checked={offersDelivery} 
                                            onCheckedChange={setOffersDelivery} 
                                        />
                                    </div>

                                    {offersDelivery && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="grid gap-2">
                                                <Label className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Pricing Model</Label>
                                                <RadioGroup name="delivery_price_type" value={deliveryPriceType} onValueChange={setDeliveryPriceType} className="flex gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="fixed" id="fixed_add" />
                                                        <Label htmlFor="fixed_add" className="text-xs font-bold">Fixed Fee</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="location_based" id="location_based_add" />
                                                        <Label htmlFor="location_based_add" className="text-xs font-bold">By Location</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            {deliveryPriceType === 'fixed' && (
                                                <div className="grid gap-1">
                                                    <Label htmlFor="delivery_price_add" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Delivery Fee (GHS)</Label>
                                                    <Input id="delivery_price_add" name="delivery_price" type="number" step="0.01" placeholder="0.00" className="bg-background border-2 h-10 text-sm rounded-lg" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-1">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description" className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Description</Label>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-6 gap-1 px-2 text-[8px] font-black uppercase border-primary/20 text-primary hover:bg-primary/5 rounded-full"
                                            onClick={handleGenerateDescription}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? <Loader2 className="h-2 w-2 animate-spin" /> : <Sparkles className="h-2 w-2" />}
                                            AI Assistant
                                        </Button>
                                    </div>
                                    <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-muted/30 border-2 text-sm rounded-lg resize-none" />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="font-black text-[8px] uppercase tracking-widest text-muted-foreground">Product Media</Label>
                                    <div className="flex flex-col gap-2">
                                        <Input id="image" name="image" type="file" accept="image/*" required onChange={handleProductImageChange} className="bg-muted/30 border-2 h-10 text-[9px] rounded-lg pt-3 cursor-pointer" />
                                        {productImagePreview && (
                                            <div className="relative aspect-video w-full rounded-[16px] overflow-hidden border-2 bg-muted shadow-inner">
                                                <Image src={productImagePreview} alt="" fill className="object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 border-t bg-background flex-shrink-0">
                                <Button type="submit" className="w-full h-12 text-xs font-black uppercase tracking-[1.5px] shadow-2xl shadow-primary/20 rounded-xl" disabled={isAddPending}>
                                    {isAddPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Confirm Listing'}
                                </Button>
                            </div>
                        </form>
                      </DialogContent>
                  </Dialog>
                  
                  <Button asChild variant="secondary" className="h-10 rounded-[16px] bg-[#2A2A2A] hover:bg-[#333] text-white border-none font-black uppercase tracking-[1.2px] text-[10px] transition-all active:scale-95">
                      <Link href={`/shops/${seller.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5 stroke-[2px]" /> View Shop
                      </Link>
                  </Button>
              </div>
          </div>

          {/* 2. Professional Dashboard Tabs (High Density) */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="bg-white rounded-[20px] p-1 shadow-lg border border-border/50 sticky top-[72px] md:top-[100px] z-20 w-full overflow-x-auto no-scrollbar">
                <TabsList className="bg-transparent h-auto gap-1 flex w-max min-w-full">
                    <TabsTrigger value="overview" className="flex-1 rounded-[14px] py-2.5 px-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white transition-all">
                        <LayoutGrid className="h-3.5 w-3.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="flex-1 rounded-[14px] py-2.5 px-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white transition-all">
                        <ShoppingBag className="h-3.5 w-3.5" /> Orders 
                        {pendingOrdersCount > 0 && <Badge className="ml-1 bg-red-500 text-white text-[8px] font-black h-3.5 w-3.5 rounded-full p-0 flex items-center justify-center">{pendingOrdersCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 rounded-[14px] py-2.5 px-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white transition-all">
                        <Package className="h-3.5 w-3.5" /> Products
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="flex-1 rounded-[14px] py-2.5 px-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white transition-all">
                        <Users className="h-3.5 w-3.5" /> Clients
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1 rounded-[14px] py-2.5 px-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white transition-all">
                        <Settings className="h-3.5 w-3.5" /> Profile
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* 3. Overview Tab (Professional Performance Grid) */}
            <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                    <p className="text-[8px] font-black uppercase tracking-[2px] text-muted-foreground ml-3">Performance Matrix</p>
                    
                    {/* Net Revenue Hero Card (Professional Size) */}
                    <Card className="bg-[#10B981] border-none rounded-[32px] p-6 md:p-8 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 w-[30%] h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-[60px] -mr-12 -mb-12" />
                        <div className="space-y-2 md:space-y-3 relative z-10">
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[1.5px] opacity-70 flex items-center gap-1.5">
                                📊 Aggregate Earnings
                            </p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-sm md:text-base font-black opacity-60">GHS</span>
                                <h2 className="text-4xl md:text-5xl font-black leading-none tracking-tight">
                                    {formatPrice(totalRevenue).replace('GHS ', '')}
                                </h2>
                            </div>
                            <p className="text-[8px] font-black opacity-60 uppercase tracking-[2px]">Total Storefront Liquidity</p>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Order Volume Card (Dense) */}
                        <Card className="bg-[#F5A623] border-none rounded-[28px] p-5 md:p-6 text-white shadow-xl shadow-orange-500/10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-black/10 rounded-full blur-[25px] -mr-6 -mt-6" />
                            <div className="space-y-2 relative z-10">
                                <p className="text-[8px] font-black uppercase tracking-[1.5px] opacity-70 flex items-center gap-1">
                                    <ShoppingBag className="h-3 w-3" /> Volume
                                </p>
                                <h2 className="text-3xl md:text-4xl font-black leading-none">{orders.length}</h2>
                                <p className="text-[8px] font-black opacity-60 uppercase tracking-[1.5px]">Orders Processed</p>
                            </div>
                        </Card>

                        {/* Clients Card (Dense) */}
                        <Card className="bg-white border border-border/50 rounded-[28px] p-5 md:p-6 shadow-xl overflow-hidden relative group">
                            <div className="space-y-2 relative z-10">
                                <p className="text-[8px] font-black uppercase tracking-[1.5px] text-primary flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Outreach
                                </p>
                                <h2 className="text-3xl md:text-4xl font-black text-foreground leading-none">{uniqueCustomers.length}</h2>
                                <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-[1.5px]">Unique Campus Buyers</p>
                            </div>
                            <button 
                                onClick={() => setIsAddDialogOpen(true)}
                                className="absolute bottom-5 right-5 w-9 h-9 bg-[#F5A623] rounded-[14px] flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-90 transition-all duration-300"
                            >
                                <Plus className="h-5 w-5 stroke-[3px]" />
                            </button>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="orders" className="animate-in fade-in duration-500 mt-6">
                <Card className="border-none shadow-xl bg-background rounded-[28px] overflow-hidden">
                    <CardHeader className="bg-muted/5 border-b p-6 flex flex-row items-center justify-between gap-4">
                        <div className="min-w-0">
                            <CardTitle className="text-base font-black uppercase tracking-[1.5px] truncate">Order Ledger</CardTitle>
                            <CardDescription className="text-[10px] font-medium">Real-time transaction status.</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleSync} disabled={isPending} className="h-9 w-9 rounded-xl border-2">
                            <RefreshCw className={cn("h-3.5 w-3.5 text-primary", isPending && "animate-spin")} />
                        </Button>
                    </CardHeader>
                    
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-muted/5">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-[8px] tracking-wider py-4 px-8 text-muted-foreground">Buyer</TableHead>
                                    <TableHead className="font-black uppercase text-[8px] tracking-wider text-muted-foreground">Product & Logistics</TableHead>
                                    <TableHead className="font-black uppercase text-[8px] tracking-wider text-muted-foreground">Gross</TableHead>
                                    <TableHead className="font-black uppercase text-[8px] tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-black uppercase text-[8px] tracking-wider text-right px-8 text-muted-foreground">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const productName = order.products?.name || order.vendor_products?.name || 'Unknown Product';
                                    return (
                                        <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell className="px-8 py-4">
                                                <div className="font-black text-sm">{order.profiles?.display_name}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{order.profiles?.phone_number}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium truncate max-w-[200px]">{productName}</div>
                                                {order.delivery_location && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-black uppercase mt-1">
                                                        <MapPin className="h-3 w-3" /> {order.delivery_location}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-black text-sm text-foreground">GHS {formatPrice(order.price_per_item * order.quantity).replace('GHS ', '')}</TableCell>
                                            <TableCell>
                                                <Badge className="font-black text-[8px] px-1.5 py-0 uppercase tracking-tighter" variant={
                                                    order.status === 'completed' ? 'default' :
                                                    order.status === 'ready' ? 'secondary' : 'outline'
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex justify-end items-center gap-2">
                                                    {order.status === 'pending' && (
                                                        <Button size="sm" className="h-7 font-black uppercase text-[8px] px-2 rounded-lg" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Ready</Button>
                                                    )}
                                                    {order.status === 'ready' && (
                                                        <Button size="sm" variant="outline" className="h-7 font-black uppercase text-[8px] px-2 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Done</Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-all rounded-lg" asChild>
                                                        <Link href={`/admin/sales/${order.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden divide-y">
                        {orders.map((order) => {
                            const productName = order.products?.name || order.vendor_products?.name || 'Unknown Product';
                            return (
                                <div key={order.id} className="p-4 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">
                                                {order.profiles?.display_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-[11px] leading-none">{order.profiles?.display_name}</p>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{order.profiles?.phone_number}</p>
                                            </div>
                                        </div>
                                        <Badge className="font-black text-[7px] uppercase h-4" variant={order.status === 'completed' ? 'default' : 'outline'}>{order.status}</Badge>
                                    </div>
                                    <div className="bg-muted/30 p-2.5 rounded-[14px] space-y-1">
                                        <p className="text-[10px] font-black truncate">{productName}</p>
                                        {order.delivery_location && (
                                            <p className="text-[9px] text-primary font-black uppercase flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {order.delivery_location}
                                            </p>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Qty: {order.quantity}</span>
                                            <span className="font-black text-[11px]">GHS {formatPrice(order.price_per_item * order.quantity)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {order.status === 'pending' && <Button size="sm" className="flex-1 h-9 font-black uppercase text-[8px] rounded-lg" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Mark Ready</Button>}
                                        {order.status === 'ready' && <Button size="sm" variant="outline" className="flex-1 h-9 font-black uppercase text-[8px] rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Delivered</Button>}
                                        <Button size="sm" variant="secondary" className="h-9 px-3 rounded-lg font-black uppercase text-[8px]" asChild>
                                            <Link href={`/admin/sales/${order.id}`}>Review</Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="products" className="animate-in fade-in duration-500 mt-6">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 w-full">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden border-none shadow-lg bg-background group ring-1 ring-border/50 hover:ring-primary/40 transition-all duration-500 rounded-[24px]">
                            <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                {product.image_urls && product.image_urls.length > 0 ? (
                                    <Image src={product.image_urls[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                )}
                                <div className="absolute top-2 right-2 z-10">
                                     <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg shadow-xl md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteProduct(product.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                                     <Badge className="bg-black/60 backdrop-blur-md border-none text-white text-[7px] font-black uppercase tracking-widest rounded-md h-4">{product.category}</Badge>
                                     {product.offers_delivery && (
                                         <Badge className="bg-emerald-600/80 backdrop-blur-md border-none text-white text-[7px] font-black uppercase tracking-widest rounded-md h-4 flex items-center gap-1">
                                             <Truck className="h-2 w-2" /> Delivery
                                         </Badge>
                                     )}
                                </div>
                            </div>
                            <CardContent className="p-3.5 space-y-1">
                                <h3 className="font-black truncate text-[10px] md:text-[11px] leading-tight text-foreground uppercase tracking-tight">{product.name}</h3>
                                <p className="text-primary font-black text-sm">GHS {formatPrice(product.price).replace('GHS ', '')}</p>
                                <EditProductDialog product={product} onUpdateSuccess={handleSync} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="customers" className="animate-in fade-in duration-500 mt-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
                    {uniqueCustomers.map((cust) => (
                        <Card key={cust.id} className="p-5 md:p-6 border-none shadow-xl bg-background hover:translate-y-[-3px] transition-all duration-500 rounded-[28px]">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-2xl shadow-inner border border-primary/10">
                                        {cust.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-1 rounded-full border-[3px] border-background shadow-lg">
                                        <CheckCircle className="h-2.5 w-2.5" />
                                    </div>
                                </div>
                                <div className="min-w-0 w-full">
                                    <p className="font-black text-base leading-tight truncate">{cust.name}</p>
                                    <p className="text-[8px] font-black uppercase tracking-[2px] text-primary mt-1">{cust.totalOrders} Purchases</p>
                                </div>
                                <div className="w-full pt-1 space-y-2.5">
                                    <Separator className="opacity-40" />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 h-8 font-black uppercase tracking-widest border-2 rounded-lg text-[8px]" asChild>
                                            <a href={`tel:${cust.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                                        </Button>
                                        <Button variant="secondary" size="sm" className="flex-1 h-8 font-black uppercase tracking-widest rounded-lg text-[8px]" asChild>
                                            <Link href={`/admin/sales/customers/${cust.id}`}><TrendingUp className="h-3 w-3 mr-1" /> Stats</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="settings" className="animate-in fade-in duration-500 mt-6">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-none shadow-2xl bg-background rounded-[32px] overflow-hidden">
                        <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                            <CardTitle className="text-lg font-black uppercase tracking-[2px]">Shop Configuration</CardTitle>
                            <CardDescription className="text-[10px] font-medium mt-1">Operational and branding controls.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <form action={handleUpdateShop} className="space-y-6">
                                <div className="flex flex-col items-center gap-4 p-6 bg-muted/10 rounded-[24px] border-4 border-dashed border-muted-foreground/10 group">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 md:h-28 md:w-28 border-[4px] border-background shadow-xl ring-1 ring-primary/20">
                                            <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">{seller.shop_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Label htmlFor="logo-settings" className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 cursor-pointer backdrop-blur-md">
                                            <UploadCloud className="h-8 w-8 animate-bounce" />
                                        </Label>
                                        <Input id="logo-settings" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-[1.5px] text-muted-foreground">Tap Identity to Change</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="shop_name_settings" className="font-black text-[8px] uppercase tracking-[2px] text-muted-foreground ml-1">Shop Nomenclature</Label>
                                        <Input id="shop_name_settings" name="shop_name" defaultValue={seller.shop_name} required className="h-12 border-2 rounded-xl text-sm font-black px-5 focus:border-primary/50 bg-muted/20" />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="description_settings" className="font-black text-[8px] uppercase tracking-[2px] text-muted-foreground ml-1">Business Directive</Label>
                                        <Textarea id="description_settings" name="description" defaultValue={seller.description || ''} placeholder="What do you specialize in?..." className="min-h-[110px] border-2 rounded-xl text-xs font-medium px-5 py-3 resize-none bg-muted/20 focus:border-primary/40" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="open_time_settings" className="font-black text-[8px] uppercase tracking-[2px] text-muted-foreground ml-1">Commencement</Label>
                                            <Input id="open_time_settings" name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-12 border-2 rounded-xl font-black px-5 bg-muted/20 text-xs" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="close_time_settings" className="font-black text-[8px] uppercase tracking-[2px] text-muted-foreground ml-1">Conclusion</Label>
                                            <Input id="close_time_settings" name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-12 border-2 rounded-xl font-black px-5 bg-muted/20 text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14 text-sm font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 rounded-xl transition-all hover:scale-[1.01] mt-2" disabled={isUpdatePending}>
                                    {isUpdatePending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Settings className="mr-2 h-4 w-4" />}
                                    Synchronize Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
