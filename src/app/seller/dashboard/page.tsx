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
    Sparkles
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { logout } from '@/app/auth/actions';
import { generateProductDescription } from '@/ai/flows/ai-product-description-assistant';

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
    
    // Sanitize description for editing while keeping backend tag
    const [productName, setProductName] = useState(product.name || '');
    const [description, setDescription] = useState(product.description?.replace(' (AI Enhanced)', '') || '');
    const [isGenerating, startGeneratingTransition] = useTransition();

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
                    // AI returns with tag, strip it for the editor but keep it for logic later
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
                // AI returns with tag, strip it for the UI
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

  const userLinks = [
    { title: "Profile", description: "View and edit your profile", href: "/profile", icon: Users },
    { title: "My Orders", description: "Track your past and current orders", href: "/orders", icon: ShoppingBag },
    { title: "Wishlist", description: "View your saved products", href: "/saved", icon: Heart },
    { title: "Request a Product", description: "Tell us what you want to see", href: "/request-product", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col w-full">
      {/* Mobile-Friendly Slim Command Bar */}
      <div className="md:hidden bg-background/95 backdrop-blur-md border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-primary">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-3/4 max-w-sm p-0 flex flex-col bg-background border-r-0 shadow-2xl">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Dashboard Navigation</SheetTitle>
                    </SheetHeader>
                    
                    <div className="relative p-6 bg-[var(--gold)] text-white h-[140px] flex items-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12" />
                        
                        <div className="relative z-10 flex items-center gap-3 w-full">
                            <div className="h-12 w-12 rounded-full border-2 border-white/30 bg-white overflow-hidden shadow-md flex items-center justify-center">
                                {user?.user_metadata?.avatar_url ? (
                                    <Image src={user.user_metadata.avatar_url} alt="Profile" width={48} height={48} className="object-cover h-full w-full" />
                                ) : (
                                    <span className="text-[var(--gold)] font-black text-xl">{seller.shop_name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-base truncate">{seller.shop_name}</p>
                                <p className="text-xs text-white/80 font-medium">Vendor Console</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="flex flex-col">
                            <SheetClose asChild>
                                <Link href="/" className="flex items-center gap-4 p-4 hover:bg-muted/50">
                                    <div className="p-2 bg-muted rounded-xl"><Home className="h-5 w-5 text-primary" /></div>
                                    <div><p className="font-bold text-sm">Storefront</p><p className="text-[10px] text-muted-foreground">Return to main market</p></div>
                                </Link>
                            </SheetClose>
                            {userLinks.map(link => (
                                <SheetClose asChild key={link.href}>
                                    <Link href={link.href} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                                        <div className="p-2 bg-muted rounded-xl"><link.icon className="h-5 w-5 text-primary" /></div>
                                        <div><p className="font-bold text-sm">{link.title}</p><p className="text-[10px] text-muted-foreground">{link.description}</p></div>
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6 mt-auto border-t">
                        <form action={logout}>
                            <Button className="w-full h-12 font-black uppercase tracking-widest rounded-2xl bg-[var(--gold)] text-white">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                <Link href="/"><Home className="h-5 w-5 text-muted-foreground" /></Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleSync} disabled={isPending}>
                <RefreshCw className={cn("h-5 w-5 text-primary", isPending && "animate-spin")} />
            </Button>
            <ThemeToggle />
          </div>
      </div>

      {/* Main Header */}
      <div className="bg-background border-b px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm w-full">
          <div className="flex items-center gap-3 md:gap-4">
              <div className="relative group shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{seller.shop_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background", seller.is_open ? "bg-emerald-500" : "bg-destructive")} />
              </div>
              <div className="min-w-0">
                  <div className="flex items-center gap-2">
                      <h1 className="text-lg md:text-xl font-black tracking-tight truncate">{seller.shop_name}</h1>
                      <Badge variant="outline" className="text-[9px] px-1.5 h-4 uppercase font-bold text-muted-foreground border-muted-foreground/20 shrink-0">VENDOR</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                       <div className="flex items-center gap-2">
                          <Switch 
                              id="shop-toggle" 
                              checked={seller.is_open} 
                              onCheckedChange={(checked) => handleToggle(checked)}
                              disabled={isPending}
                              className="scale-75"
                          />
                          <Label htmlFor="shop-toggle" className={cn("text-[9px] font-black uppercase tracking-widest", seller.is_open ? "text-emerald-600" : "text-destructive")}>
                              {seller.is_open ? 'OPEN' : 'CLOSED'}
                          </Label>
                       </div>
                  </div>
              </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
              <Button asChild variant="outline" size="sm" className="rounded-xl font-bold h-10 border-2 text-xs order-2 sm:order-1">
                  <Link href={`/shops/${seller.id}`}>
                      <Eye className="h-4 w-4 mr-2" /> View Shop
                  </Link>
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20 text-xs md:text-sm order-1 sm:order-2">
                        <Plus className="h-4 w-4 mr-1 md:mr-2" /> List Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95%] max-w-[550px] p-0 overflow-hidden rounded-3xl flex flex-col max-h-[80vh] border-none shadow-2xl">
                      <div className="bg-primary p-5 md:p-6 text-primary-foreground flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl font-black tracking-tight text-white">Create New Listing</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 text-xs md:text-sm">
                                This product will appear in your shop instantly.
                            </DialogDescription>
                        </DialogHeader>
                      </div>
                      <form action={addAction} className="flex flex-col flex-1 overflow-hidden bg-background">
                          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-4 space-y-5 hide-scrollbar">
                                  <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Name</Label>
                                    <Input id="name" name="name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Vintage Leather Bag" required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="price" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Selling Price (GHS)</Label>
                                      <Input id="price" name="price" type="number" step="0.01" placeholder="Price" required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="category" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                      <Select name="category" required onValueChange={setUploadCategory}>
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
                                          <Input id="custom_category" name="custom_category" placeholder="Custom category" required className="bg-muted/30 border-2 h-11 text-sm md:text-base rounded-xl" />
                                      </div>
                                  )}

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
                                            AI Generate
                                        </Button>
                                    </div>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Detailed specifications..." 
                                        rows={3} 
                                        className="bg-muted/30 border-2 text-sm md:text-base rounded-xl resize-none" 
                                    />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Image</Label>
                                    <div className="flex flex-col gap-4">
                                        <Input 
                                            id="image" 
                                            name="image" 
                                            type="file" 
                                            accept="image/*" 
                                            required 
                                            onChange={handleProductImageChange}
                                            className="bg-muted/30 border-2 h-11 text-xs rounded-xl cursor-pointer pt-3"
                                        />
                                        {productImagePreview && (
                                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner">
                                                <Image src={productImagePreview} alt="Preview" fill className="object-contain" />
                                            </div>
                                        )}
                                    </div>
                                  </div>
                          </div>

                          <div className="p-5 md:p-6 border-t bg-background flex-shrink-0">
                            <Button type="submit" className="w-full h-12 md:h-14 text-sm md:text-base font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl" disabled={isAddPending}>
                              {isAddPending ? <Loader2 className="animate-spin mr-3 h-5 w-5" /> : 'Publish Listing'}
                            </Button>
                          </div>
                      </form>
                    </DialogContent>
                </Dialog>
          </div>
      </div>

      {/* Dashboard Content */}
      <main className="flex-1 w-full p-4 md:p-10 space-y-8 max-w-full">
          <Tabs defaultValue="overview" className="w-full">
            <div className="bg-background p-1 md:p-2 rounded-2xl border shadow-sm sticky top-[120px] md:top-[100px] z-20 w-full overflow-x-auto no-scrollbar">
                <TabsList className="bg-transparent h-auto gap-1 md:gap-2 flex w-max min-w-full">
                    <TabsTrigger value="overview" className="rounded-xl gap-2 py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-xl gap-2 py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">
                        <ShoppingBag className="h-4 w-4" /> Orders 
                        {pendingOrdersCount > 0 && <Badge className="ml-1 bg-white text-primary text-[10px] font-black">{pendingOrdersCount}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="products" className="rounded-xl gap-2 py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">
                        <Package className="h-4 w-4" /> Products
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-xl gap-2 py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">
                        <Users className="h-4 w-4" /> Customers
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-xl gap-2 py-2 md:py-3 px-4 md:px-6 text-xs md:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap">
                        <Settings className="h-4 w-4" /> Profile
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 md:space-y-8 animate-in fade-in duration-500 mt-6">
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[2px] opacity-80 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" /> Net Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl md:text-4xl font-black">GHS {formatPrice(totalRevenue)}</p>
                            <p className="text-[10px] font-bold mt-2 opacity-80 uppercase">Lifetime earnings</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[2px] opacity-80 flex items-center gap-2">
                                <ShoppingBag className="h-3 w-3" /> Total Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl md:text-4xl font-black">{orders.length}</p>
                            <p className="text-[10px] font-bold mt-2 opacity-80 uppercase">Lifetime orders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900 shadow-xl border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[2px] text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3 text-orange-500" /> Pending Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl md:text-4xl font-black text-orange-500">{pendingOrdersCount}</p>
                            <p className="text-[10px] font-bold mt-2 text-muted-foreground uppercase">New/Ready orders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900 shadow-xl border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[9px] md:text-[10px] font-black uppercase tracking-[2px] text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3 text-primary" /> Active Clients
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl md:text-4xl font-black">{uniqueCustomers.length}</p>
                            <p className="text-[10px] font-bold mt-2 text-muted-foreground uppercase">Unique buyers</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
                     <Card className="border-none shadow-lg bg-background overflow-hidden">
                        <CardHeader className="border-b bg-muted/5 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Awaiting Logistics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="divide-y">
                                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 5).map(order => (
                                     <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{order.profiles?.display_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black truncate">{order.profiles?.display_name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[120px] md:max-w-[150px]">{order.products?.name || order.vendor_products?.name}</p>
                                            </div>
                                        </div>
                                        <Badge variant={order.status === 'ready' ? 'secondary' : 'outline'} className="font-black text-[9px] uppercase px-1.5 h-5">{order.status}</Badge>
                                     </div>
                                ))}
                                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 && (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">All caught up!</p>
                                    </div>
                                )}
                             </div>
                        </CardContent>
                     </Card>

                     <Card className="border-none shadow-lg bg-background overflow-hidden">
                        <CardHeader className="border-b bg-muted/5 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">New Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-4 gap-2">
                                {products.slice(0, 12).map(product => (
                                    <Link href={`/products/${product.id}`} key={product.id} className="relative aspect-square rounded-xl overflow-hidden group bg-muted flex items-center justify-center border hover:border-primary/50 transition-all">
                                        {product.image_urls?.[0] ? (
                                            <Image src={product.image_urls[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                                            <p className="text-[9px] text-white font-bold line-clamp-2 w-full">{product.name}</p>
                                        </div>
                                    </Link>
                                ))}
                                {products.length === 0 && (
                                     <div className="col-span-full py-12 text-center text-muted-foreground w-full">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No items listed</p>
                                    </div>
                                )}
                             </div>
                        </CardContent>
                     </Card>
                </div>
            </TabsContent>

            <TabsContent value="orders" className="animate-in fade-in duration-500 mt-6">
                <div className="flex flex-col gap-6">
                    <Card className="border-none shadow-xl bg-background overflow-hidden w-full">
                        <CardHeader className="bg-muted/5 border-b p-5 md:p-6 flex flex-row items-center justify-between gap-4">
                            <div className="min-w-0">
                                <CardTitle className="text-base md:text-lg font-black uppercase tracking-widest truncate">Transaction Ledger</CardTitle>
                                <CardDescription className="text-xs font-medium">Manage your shop orders.</CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleSync} 
                                disabled={isPending}
                                className="h-9 font-bold border-2 shrink-0"
                            >
                                <RefreshCw className={cn("h-3 w-3 mr-2", isPending && "animate-spin")} />
                                Sync
                            </Button>
                        </CardHeader>
                        
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow>
                                        <TableHead className="font-black uppercase text-[10px] tracking-wider">Client Identity</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-wider">Product Segment</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-wider">Amount</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-wider">Current Phase</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-wider text-right">Logistics Update</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        const productName = order.products?.name || order.vendor_products?.name || 'Unknown Product';
                                        return (
                                            <TableRow key={order.id} className="hover:bg-muted/10 transition-colors group">
                                                <TableCell>
                                                    <div className="font-black text-sm">{order.profiles?.display_name}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-2 w-2" /> {order.profiles?.phone_number}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium max-w-[200px] lg:max-w-[400px] truncate">{productName}</div>
                                                    <div className="text-[10px] text-muted-foreground font-bold">ID: {order.id.substring(0, 8)}</div>
                                                </TableCell>
                                                <TableCell className="font-black text-sm">GHS {formatPrice(order.price_per_item * order.quantity)}</TableCell>
                                                <TableCell>
                                                    <Badge className="font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter" variant={
                                                        order.status === 'completed' ? 'default' :
                                                        order.status === 'ready' ? 'secondary' : 'outline'
                                                    }>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {order.status === 'pending' && (
                                                            <Button size="sm" className="h-8 font-black uppercase text-[10px] px-4 rounded-lg" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Mark Ready</Button>
                                                        )}
                                                        {order.status === 'ready' && (
                                                            <Button size="sm" variant="outline" className="h-8 font-black uppercase text-[10px] px-4 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Handover</Button>
                                                        )}
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all rounded-lg" asChild>
                                                            <Link href={`/admin/sales/${order.id}`}><Eye className="h-4 w-4" /></Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {orders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic font-medium">No orders yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="md:hidden divide-y">
                            {orders.map((order) => {
                                const productName = order.products?.name || order.vendor_products?.name || 'Unknown Product';
                                return (
                                    <div key={order.id} className="p-5 space-y-4 hover:bg-muted/5 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">{order.profiles?.display_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-black text-sm">{order.profiles?.display_name}</p>
                                                    <a href={`tel:${order.profiles?.phone_number}`} className="text-[10px] font-bold text-primary flex items-center gap-1"><Phone className="h-2 w-2" /> {order.profiles?.phone_number}</a>
                                                </div>
                                            </div>
                                            <Badge className="font-black text-[9px] px-1.5 py-0.5 uppercase tracking-tighter" variant={
                                                order.status === 'completed' ? 'default' :
                                                order.status === 'ready' ? 'secondary' : 'outline'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </div>

                                        <div className="bg-muted/30 p-3 rounded-xl space-y-1">
                                            <p className="text-xs font-bold truncate">{productName}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-muted-foreground font-bold">QTY: {order.quantity}</span>
                                                <span className="font-black text-xs">GHS {formatPrice(order.price_per_item * order.quantity)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {order.status === 'pending' && (
                                                <Button size="sm" className="flex-1 h-10 font-black uppercase text-[10px] rounded-xl" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Mark Ready</Button>
                                            )}
                                            {order.status === 'ready' && (
                                                <Button size="sm" variant="outline" className="flex-1 h-10 font-black uppercase text-[10px] rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Complete Handover</Button>
                                            )}
                                            <Button size="sm" variant="secondary" className="h-10 px-4 rounded-xl font-black uppercase text-[10px]" asChild>
                                                <Link href={`/admin/sales/${order.id}`}>Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {orders.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground italic text-sm">No transactions yet.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="products" className="animate-in fade-in duration-500 mt-6">
                <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden border-none shadow-lg bg-background group ring-1 ring-border/50 hover:ring-primary/40 transition-all duration-300">
                            <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                {product.image_urls && product.image_urls.length > 0 ? (
                                    <Image 
                                        src={product.image_urls[0]} 
                                        alt={product.name} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <ImageIcon className="h-8 md:h-12 w-8 md:w-12 text-muted-foreground/30" />
                                )}
                                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                                     <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => handleDeleteProduct(product.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-2 left-2">
                                     <Badge className="bg-black/60 backdrop-blur-md border-none text-white text-[8px] md:text-[9px] font-black uppercase">{product.category}</Badge>
                                </div>
                            </div>
                            <CardContent className="p-3 md:p-4">
                                <h3 className="font-bold truncate text-xs md:text-sm leading-tight text-foreground">{product.name}</h3>
                                <p className="text-primary font-black mt-1 text-sm md:text-lg">GHS {formatPrice(product.price)}</p>
                                <EditProductDialog product={product} onUpdateSuccess={handleSync} />
                            </CardContent>
                        </Card>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-24 md:py-32 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 w-full">
                            <Package className="h-12 md:h-16 text-muted-foreground/10 mx-auto mb-4" />
                            <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-muted-foreground opacity-30">Inventory Empty</h3>
                            <Button className="mt-4 md:mt-6 font-bold rounded-xl text-xs" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Start Selling</Button>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="customers" className="animate-in fade-in duration-500 mt-6">
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full">
                    {uniqueCustomers.map((cust) => (
                        <Card key={cust.id} className="p-5 md:p-6 border-none shadow-lg bg-background hover:translate-y-[-4px] transition-all">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-16 md:h-20 w-16 md:w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-2xl md:text-3xl shadow-inner border">
                                        {cust.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-4 border-background">
                                        <CheckCircle className="h-3 w-3" />
                                    </div>
                                </div>
                                <div className="min-w-0 w-full">
                                    <p className="font-black text-base md:text-lg leading-tight truncate">{cust.name}</p>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary mt-1">{cust.totalOrders} orders</p>
                                </div>
                                <div className="w-full space-y-2 pt-2">
                                     <a href={`tel:${cust.phone}`} className="flex items-center justify-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                                        <Phone className="h-3 w-3" /> {cust.phone}
                                    </a>
                                    <Separator className="opacity-50" />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 h-10 font-bold border-2 rounded-xl text-[10px] md:text-xs" asChild>
                                            <a href={`tel:${cust.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" /> Call</a>
                                        </Button>
                                        <Button variant="secondary" size="sm" className="flex-1 h-10 font-bold rounded-xl text-[10px] md:text-xs" asChild>
                                            <Link href={`/admin/sales/customers/${cust.id}`}><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Data</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {uniqueCustomers.length === 0 && (
                        <div className="col-span-full py-20 md:py-32 text-center bg-muted/10 rounded-3xl border-2 border-dashed w-full">
                             <p className="text-[10px] md:text-sm font-black uppercase tracking-[3px] text-muted-foreground opacity-20 italic">No Clients Found</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="settings" className="animate-in fade-in duration-500 mt-6">
                <div className="max-w-4xl w-full mx-auto">
                    <Card className="border-none shadow-xl bg-background overflow-hidden">
                        <CardHeader className="bg-muted/5 border-b p-6 md:p-8">
                            <CardTitle className="text-lg md:text-xl font-black uppercase tracking-widest">Business Identity</CardTitle>
                            <CardDescription className="text-xs md:text-sm font-medium">Maintain shop profile and operational hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <form action={handleUpdateShop} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8 p-6 md:p-8 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                                        <div className="relative group mx-auto sm:mx-0">
                                            <Avatar className="h-24 md:h-32 w-24 md:w-32 border-4 border-background shadow-2xl ring-1 ring-primary/20">
                                                <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                                                <AvatarFallback className="text-3xl md:text-4xl font-black bg-primary/10 text-primary">{seller.shop_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="logo" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                                <UploadCloud className="h-8 md:h-10 w-8 md:w-10 animate-bounce" />
                                            </Label>
                                            <Input id="logo" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                        </div>
                                        <div className="text-center sm:text-left space-y-1">
                                            <h4 className="font-black uppercase tracking-widest text-sm">Shop Branding</h4>
                                            <p className="text-[10px] md:text-[12px] text-muted-foreground font-medium">Stand out in the vendor gallery.</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="shop_name" className="font-black text-[9px] md:text-[10px] uppercase tracking-[3px] text-muted-foreground">Registered Shop Name</Label>
                                        <Input id="shop_name" name="shop_name" defaultValue={seller.shop_name} required className="h-12 md:h-14 border-2 rounded-xl text-base md:text-lg font-bold px-4 md:px-6 focus:border-primary/50" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="open_time" className="font-black text-[9px] md:text-[10px] uppercase tracking-[3px] text-muted-foreground">Open Time</Label>
                                            <Input id="open_time" name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-12 md:h-14 border-2 rounded-xl font-bold px-4 md:px-6" />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="close_time" className="font-black text-[9px] md:text-[10px] uppercase tracking-[3px] text-muted-foreground">Close Time</Label>
                                            <Input id="close_time" name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-12 md:h-14 border-2 rounded-xl font-bold px-4 md:px-6" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14 md:h-16 text-base md:text-lg font-black uppercase tracking-[3px] md:tracking-[4px] shadow-2xl shadow-primary/20 rounded-2xl transition-all mt-4" disabled={isUpdatePending}>
                                    {isUpdatePending ? <Loader2 className="animate-spin mr-3 h-5 md:h-6 w-5 md:w-6" /> : <Settings className="mr-3 h-5 md:h-6 w-5 md:w-6" />}
                                    Update Business Identity
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
          </Tabs>
      </main>
    </div>
  );
}
