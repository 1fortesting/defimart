'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleShopStatus, addSellerProduct, updateShopInfo } from '../actions';
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
    X,
    UploadCloud,
    Trash2,
    CheckCircle,
    Store,
    RefreshCw
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

export default function SellerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isAddPending, startAddTransition] = useTransition();
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [uploadCategory, setUploadCategory] = useState('');
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: sellerData } = await supabase.from('sellers' as any).select('*').eq('user_id', user.id).single();
    setSeller(sellerData);

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
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

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

  const handleAddProduct = async (formData: FormData) => {
    startAddTransition(async () => {
        const result = await addSellerProduct(formData);
        if (result.success) {
            setIsAddDialogOpen(false);
            setProductImagePreview(null);
            setUploadCategory('');
            toast({ variant: 'success', title: 'Product listed successfully' });
            fetchData();
        } else {
            toast({ title: 'Upload Error', description: result.error, variant: 'destructive' });
        }
    });
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
    <div className="min-h-screen bg-muted/10 flex flex-col w-full">
      {/* Immersive Header */}
      <div className="bg-background border-b sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm w-full">
          <div className="flex items-center gap-4">
              <div className="relative group">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{seller.shop_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background", seller.is_open ? "bg-emerald-500" : "bg-destructive")} />
              </div>
              <div>
                  <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black tracking-tight">{seller.shop_name}</h1>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground border-muted-foreground/20">VENDOR</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                       <p className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500" /> Verified Seller
                       </p>
                       <Separator orientation="vertical" className="h-3" />
                       <div className="flex items-center gap-2">
                          <Switch 
                              id="shop-toggle-top" 
                              checked={seller.is_open} 
                              onCheckedChange={(checked) => handleToggle(checked)}
                              disabled={isPending}
                              className="scale-75"
                          />
                          <Label htmlFor="shop-toggle-top" className={cn("text-[10px] font-black uppercase tracking-widest", seller.is_open ? "text-emerald-600" : "text-destructive")}>
                              {seller.is_open ? 'SHOP OPEN' : 'SHOP CLOSED'}
                          </Label>
                       </div>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl font-bold h-10 border-2">
                  <Link href={`/shops/${seller.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" /> View Public Shop
                  </Link>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> List New Product</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
                      <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">Create New Listing</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80">
                                This product will appear in your shop instantly.
                            </DialogDescription>
                        </DialogHeader>
                      </div>
                      <form action={handleAddProduct} className="flex flex-col flex-1 overflow-hidden bg-background">
                          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
                                  <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Name</Label>
                                    <Input id="name" name="name" placeholder="What are you selling?" required className="bg-muted/30 border-2 h-12 text-base rounded-xl" />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="price" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Selling Price (GHS)</Label>
                                      <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required className="bg-muted/30 border-2 h-12 text-base rounded-xl" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="category" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
                                      <Select name="category" required onValueChange={setUploadCategory}>
                                          <SelectTrigger className="bg-muted/30 border-2 h-12 text-base rounded-xl">
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
                                          <Input id="custom_category" name="custom_category" placeholder="e.g. Vintage Apparel" required className="bg-muted/30 border-2 h-12 text-base rounded-xl" />
                                      </div>
                                  )}

                                  <div className="grid gap-2">
                                    <Label htmlFor="description" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Detailed Description</Label>
                                    <Textarea id="description" name="description" placeholder="Share features, condition, size etc..." rows={4} className="bg-muted/30 border-2 text-base rounded-xl resize-none" />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Product Image</Label>
                                    {productImagePreview ? (
                                      <div className="relative group aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner">
                                        <Image src={productImagePreview} alt="Preview" fill className="object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={() => setProductImagePreview(null)}
                                                className="bg-white text-destructive p-3 rounded-full shadow-lg"
                                            >
                                                <Trash2 className="h-6 w-6" />
                                            </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all bg-muted/20 border-muted-foreground/20 group text-center">
                                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                              <UploadCloud className="w-10 h-10 text-primary mb-3 transition-transform group-hover:scale-110" />
                                              <p className="text-sm font-black uppercase tracking-widest">Select Product Photo</p>
                                              <p className="text-[10px] text-muted-foreground mt-1 font-bold">PNG, JPG or WEBP (Max 5MB)</p>
                                          </div>
                                          <Input id="image" name="image" type="file" accept="image/*" className="hidden" required onChange={handleProductImageChange} />
                                      </label>
                                    )}
                                  </div>
                          </div>

                          <div className="p-6 border-t bg-background sticky bottom-0 z-20 flex flex-col gap-3">
                            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl" disabled={isAddPending}>
                              {isAddPending ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <ShoppingBag className="mr-3 h-6 w-6" />}
                              Publish Listing
                            </Button>
                          </div>
                      </form>
                    </DialogContent>
                </Dialog>
          </div>
      </div>

      <main className="flex-1 w-full p-6 md:p-10 space-y-10 max-w-full">
          <Tabs defaultValue="overview" className="w-full">
            <div className="flex justify-between items-center mb-8 bg-background p-2 rounded-2xl border shadow-sm sticky top-[100px] z-20">
                <TabsList className="bg-transparent h-auto gap-2">
                <TabsTrigger value="overview" className="rounded-xl gap-2 py-3 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <LayoutDashboard className="h-4 w-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-xl gap-2 py-3 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <ShoppingBag className="h-4 w-4" /> Orders 
                    {pendingOrdersCount > 0 && <Badge className="ml-1 bg-white text-primary text-[10px] font-black">{pendingOrdersCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-xl gap-2 py-3 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <Package className="h-4 w-4" /> Products
                </TabsTrigger>
                <TabsTrigger value="customers" className="rounded-xl gap-2 py-3 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <Users className="h-4 w-4" /> Customers
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl gap-2 py-3 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <Settings className="h-4 w-4" /> Shop Profile
                </TabsTrigger>
                </TabsList>
                <div className="pr-2 hidden lg:block">
                     <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">Vendor Command Console</p>
                </div>
            </div>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-emerald-500 text-white border-none shadow-xl shadow-emerald-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[2px] opacity-80 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" /> Net Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-black">GHS {formatPrice(totalRevenue)}</p>
                            <p className="text-xs font-bold mt-2 opacity-80">Lifetime earnings</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[2px] opacity-80 flex items-center gap-2">
                                <ShoppingBag className="h-3 w-3" /> Total Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-black">{orders.length}</p>
                            <p className="text-xs font-bold mt-2 opacity-80">Lifetime orders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900 shadow-xl border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3 text-orange-500" /> Pending Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-black text-orange-500">{pendingOrdersCount}</p>
                            <p className="text-xs font-bold mt-2 text-muted-foreground">New/Ready orders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900 shadow-xl border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3 text-primary" /> Active Clients
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-black">{uniqueCustomers.length}</p>
                            <p className="text-xs font-bold mt-2 text-muted-foreground">Unique buyers</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8">
                     <Card className="border-none shadow-lg bg-background">
                        <CardHeader className="border-b bg-muted/5">
                            <CardTitle className="text-base font-black uppercase tracking-widest">Awaiting Logistics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="divide-y">
                                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 5).map(order => (
                                     <div key={order.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{order.profiles?.display_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-black">{order.profiles?.display_name}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{order.products?.name || order.vendor_products?.name}</p>
                                            </div>
                                        </div>
                                        <Badge variant={order.status === 'ready' ? 'secondary' : 'outline'} className="font-black text-[10px] uppercase">{order.status}</Badge>
                                     </div>
                                ))}
                                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase">All caught up!</p>
                                    </div>
                                )}
                             </div>
                        </CardContent>
                     </Card>

                     <Card className="border-none shadow-lg bg-background">
                        <CardHeader className="border-b bg-muted/5">
                            <CardTitle className="text-base font-black uppercase tracking-widest">New Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="grid grid-cols-4 gap-1 p-2">
                                {products.slice(0, 8).map(product => (
                                    <div key={product.id} className="relative aspect-square rounded-xl overflow-hidden group bg-muted flex items-center justify-center">
                                        {product.image_urls?.[0] ? (
                                            <Image src={product.image_urls[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                                            <p className="text-[10px] text-white font-bold truncate w-full">{product.name}</p>
                                        </div>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                     <div className="col-span-full p-12 text-center text-muted-foreground">
                                        <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase">No items listed</p>
                                    </div>
                                )}
                             </div>
                        </CardContent>
                     </Card>
                </div>
            </TabsContent>

            <TabsContent value="orders" className="animate-in fade-in duration-500">
                <Card className="border-none shadow-xl bg-background overflow-hidden w-full">
                    <CardHeader className="bg-muted/5 border-b p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-widest">Transaction Ledger</CardTitle>
                            <CardDescription>Comprehensive list of all shop orders.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} className="h-8 font-bold border-2"><RefreshCw className="h-3 w-3 mr-2" />Sync</Button>
                    </CardHeader>
                    <CardContent className="p-0">
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
                                                <div className="text-sm font-medium max-w-[400px] truncate">{productName}</div>
                                                <div className="text-[10px] text-muted-foreground font-bold">ID: {order.id.substring(0, 8)}</div>
                                            </TableCell>
                                            <TableCell className="font-black text-sm">GHS {formatPrice(order.price_per_item * order.quantity)}</TableCell>
                                            <TableCell>
                                                <Badge className="font-black text-[10px] px-2 py-0.5 uppercase tracking-tighter" variant={
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
                                        <TableCell colSpan(5) className="text-center py-24 text-muted-foreground italic font-medium">No orders yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="products" className="animate-in fade-in duration-500">
                <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full">
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
                                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                                )}
                                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                     <Badge className="bg-black/60 backdrop-blur-md border-none text-white text-[9px] font-black uppercase">{product.category}</Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold truncate text-sm leading-tight text-foreground">{product.name}</h3>
                                <p className="text-primary font-black mt-1 text-lg">GHS {formatPrice(product.price)}</p>
                                <Button variant="outline" size="sm" className="w-full mt-4 h-9 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary hover:text-white transition-all" asChild>
                                    <Link href={`/products/${product.id}`} target="_blank">Review Listing</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20 w-full">
                            <Package className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground opacity-30">Inventory Empty</h3>
                            <Button className="mt-6 font-bold rounded-xl" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Start Selling</Button>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="customers" className="animate-in fade-in duration-500">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full">
                    {uniqueCustomers.map((cust) => (
                        <Card key={cust.id} className="p-6 border-none shadow-lg bg-background hover:translate-y-[-4px] transition-all">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary text-3xl shadow-inner border">
                                        {cust.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-4 border-background">
                                        <CheckCircle className="h-3 w-3" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-black text-lg leading-tight">{cust.name}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{cust.totalOrders} orders</p>
                                </div>
                                <div className="w-full space-y-2 pt-2">
                                     <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
                                        <Phone className="h-3 w-3" /> {cust.phone}
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 h-10 font-bold border-2 rounded-xl" asChild>
                                            <a href={`tel:${cust.phone}`}><Phone className="h-3.5 w-3.5 mr-2" /> Call</a>
                                        </Button>
                                        <Button variant="secondary" size="sm" className="flex-1 h-10 font-bold rounded-xl" asChild>
                                            <Link href={`/admin/sales/customers/${cust.id}`}><Eye className="h-3.5 w-3.5 mr-2" /> Data</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {uniqueCustomers.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-muted/10 rounded-3xl border-2 border-dashed w-full">
                             <p className="text-sm font-black uppercase tracking-[3px] text-muted-foreground opacity-20 italic">No Clients</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="settings" className="animate-in fade-in duration-500">
                <div className="max-w-4xl w-full mx-auto">
                    <Card className="border-none shadow-xl bg-background overflow-hidden">
                        <CardHeader className="bg-muted/5 border-b p-8">
                            <CardTitle className="text-xl font-black uppercase tracking-widest">Business Identity</CardTitle>
                            <CardDescription className="font-medium">Maintain profile and hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form action={handleUpdateShop} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-8 bg-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                                        <div className="relative group mx-auto sm:mx-0">
                                            <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-1 ring-primary/20">
                                                <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                                                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{seller.shop_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="logo" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                                                <UploadCloud className="h-10 w-10 animate-bounce" />
                                            </Label>
                                            <Input id="logo" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                        </div>
                                        <div className="text-center sm:text-left space-y-1">
                                            <h4 className="font-black uppercase tracking-widest text-sm">Shop Branding</h4>
                                            <p className="text-xs text-muted-foreground font-medium">Stand out in the vendor gallery.</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="shop_name" className="font-black text-[10px] uppercase tracking-[3px] text-muted-foreground">Registered Shop Name</Label>
                                        <Input id="shop_name" name="shop_name" defaultValue={seller.shop_name} required className="h-14 border-2 rounded-xl text-lg font-bold px-6 focus:border-primary/50" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="open_time" className="font-black text-[10px] uppercase tracking-[3px] text-muted-foreground">Daily Open Time</Label>
                                            <Input id="open_time" name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-14 border-2 rounded-xl font-bold px-6" />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="close_time" className="font-black text-[10px] uppercase tracking-[3px] text-muted-foreground">Daily Close Time</Label>
                                            <Input id="close_time" name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-14 border-2 rounded-xl font-bold px-6" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-[4px] shadow-2xl shadow-primary/20 rounded-2xl transition-all" disabled={isUpdatePending}>
                                    {isUpdatePending ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Settings className="mr-3 h-6 w-6" />}
                                    Update Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
          </Tabs>
      </main>

      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-background/95 backdrop-blur-md border p-3 rounded-2xl shadow-2xl flex items-center justify-between z-40">
          <div className="flex items-center gap-3">
               <Badge className={cn("h-3 w-3 p-0 rounded-full", seller.is_open ? "bg-emerald-500" : "bg-destructive")} />
               <p className="text-[10px] font-black uppercase tracking-widest">Shop {seller.is_open ? 'Live' : 'Hidden'}</p>
          </div>
          <Button asChild size="sm" variant="ghost" className="h-8 font-black uppercase text-[10px]"><Link href="/shops">Go to Shops</Link></Button>
      </div>
    </div>
  );
}
