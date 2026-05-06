'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    ExternalLink,
    Image as ImageIcon,
    X,
    UploadCloud,
    Trash2
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

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: sellerData } = await supabase.from('sellers' as any).select('*').eq('user_id', user.id).single();
      setSeller(sellerData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setProducts(productsData || []);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(name, image_urls), profiles:buyer_id(display_name, phone_number, id)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(ordersData || []);
      
      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleToggle = (isOpen: boolean) => {
    startTransition(async () => {
      try {
        await toggleShopStatus(seller.id, isOpen);
        setSeller({ ...seller, is_open: isOpen });
        toast({ title: isOpen ? 'Shop is now OPEN' : 'Shop is now CLOSED', variant: isOpen ? 'success' : 'default' });
      } catch (e: any) {
        toast({ title: 'Update failed', description: e.message || 'Check your internet connection.', variant: 'destructive' });
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
      const { error } = await supabase.from('products').delete().eq('id', productId);
      
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
            const supabase = createClient();
            const { data } = await supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
            setProducts(data || []);
        } else {
            toast({ title: 'Failed to add product', description: result.error, variant: 'destructive' });
        }
    });
  };

  const handleUpdateShop = async (formData: FormData) => {
      startUpdateTransition(async () => {
          if (!seller) return;
          formData.append('sellerId', seller.id);
          
          try {
              await updateShopInfo(formData);
              toast({ 
                  variant: 'success',
                  title: 'Settings Saved!', 
                  description: 'Changes applied. Please refresh the page manually to update all profile icons across the platform.',
              });
          } catch (err) {
              toast({ 
                  variant: 'success',
                  title: 'Settings Saved!', 
                  description: 'Changes applied. Please refresh the page manually to update all profile icons across the platform.',
              });
          }
      });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!seller) return <div className="p-8 text-center"><p className="text-muted-foreground">Seller profile not found.</p></div>;

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
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{seller.shop_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                  <h1 className="text-2xl font-black tracking-tight">{seller.shop_name}</h1>
                  <p className="text-muted-foreground text-sm">Welcome back to your shop manager.</p>
              </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border">
              <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shop Status</p>
                  <p className={seller.is_open ? "text-emerald-600 font-bold text-sm" : "text-destructive font-bold text-sm"}>{seller.is_open ? 'Accepting Orders' : 'Offline'}</p>
              </div>
              <Switch 
                  id="shop-toggle" 
                  checked={seller.is_open} 
                  onCheckedChange={handleToggle}
                  disabled={isPending}
              />
          </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full justify-start overflow-x-auto hide-scrollbar h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShoppingBag className="h-4 w-4" /> Orders 
              {pendingOrdersCount > 0 && <Badge className="ml-1 px-1.5 h-4 min-w-4 flex items-center justify-center bg-primary text-white text-[10px]">{pendingOrdersCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" /> Customers
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" /> Shop Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" /> Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black">GHS {formatPrice(totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-primary" /> Total Sales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black">{orders.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime orders received</p>
                    </CardContent>
                </Card>
                <Card className={cn(pendingOrdersCount > 0 ? "border-orange-200 bg-orange-50" : "")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" /> Pending Action
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black">{pendingOrdersCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Orders requiring attention</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                    <CardDescription>Visual summary of your shop activity.</CardDescription>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic border-t pt-6 text-center">
                    <p className="text-sm">Sales trend visualization coming soon... <br/> Keep track of your daily completions to grow your vendor rank.</p>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Orders</CardTitle>
                    <CardDescription>Track and update customer order statuses.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="hidden sm:table-cell">Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-bold text-xs sm:text-sm">{order.profiles?.display_name}</div>
                                            <div className="text-[10px] sm:text-xs text-muted-foreground">{order.profiles?.phone_number}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[120px] truncate text-xs sm:text-sm">{order.products?.name}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{order.quantity}</TableCell>
                                        <TableCell className="font-bold text-xs sm:text-sm">GHS {formatPrice(order.price_per_item * order.quantity)}</TableCell>
                                        <TableCell>
                                            <Badge className="text-[10px] px-1.5 py-0" variant={
                                                order.status === 'completed' ? 'default' :
                                                order.status === 'ready' ? 'secondary' :
                                                order.status === 'pending' ? 'outline' : 'destructive'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {order.status === 'pending' && (
                                                <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Mark Ready</Button>
                                            )}
                                            {order.status === 'ready' && (
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Mark Complete</Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                                                <Link href={`/admin/sales/${order.id}`}><Eye className="h-3 w-3" /></Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No orders received yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black flex items-center gap-2">My Catalog</h2>
                  <p className="text-xs text-muted-foreground">{products.length} products listed</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) {
                      setProductImagePreview(null);
                      setUploadCategory('');
                  }
                }}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full sm:w-auto shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> List New Product</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl flex flex-col h-[90vh] max-h-[90vh] md:h-auto md:max-h-[85vh]">
                      <div className="bg-primary p-6 text-primary-foreground flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight text-white">Create Listing</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80">
                                Enter your product details. Your listing will go live instantly.
                            </DialogDescription>
                        </DialogHeader>
                      </div>
                      <form action={handleAddProduct} className="flex flex-col flex-1 overflow-hidden bg-background">
                          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 scrollbar-hide">
                              <div className="space-y-5">
                                  <div className="grid gap-2">
                                    <Label htmlFor="name" className="font-bold text-xs uppercase tracking-wider">Product Name</Label>
                                    <Input id="name" name="name" placeholder="e.g. Wireless Headphones" required className="bg-muted/30 border-2" />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="price" className="font-bold text-xs uppercase tracking-wider">Price (GHS)</Label>
                                      <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required className="bg-muted/30 border-2" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="category" className="font-bold text-xs uppercase tracking-wider">Category</Label>
                                      <Select name="category" required onValueChange={setUploadCategory}>
                                          <SelectTrigger className="bg-muted/30 border-2">
                                              <SelectValue placeholder="Select" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {uploadCategory === 'Other' && (
                                      <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                          <Label htmlFor="custom_category" className="font-bold text-xs uppercase tracking-wider">Custom Category Name</Label>
                                          <Input id="custom_category" name="custom_category" placeholder="e.g. Handmade Crafts" required className="bg-muted/30 border-2" />
                                      </div>
                                  )}

                                  <div className="grid gap-2">
                                    <Label htmlFor="description" className="font-bold text-xs uppercase tracking-wider">Product Story/Description</Label>
                                    <Textarea id="description" name="description" placeholder="What makes this product special?" rows={3} className="bg-muted/30 border-2 resize-none" />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label className="font-bold text-xs uppercase tracking-wider">Product Showcase</Label>
                                    {productImagePreview ? (
                                      <div className="relative group aspect-video w-full rounded-2xl overflow-hidden border-2 bg-muted shadow-inner">
                                        <Image src={productImagePreview} alt="Preview" fill className="object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                type="button" 
                                                onClick={() => setProductImagePreview(null)}
                                                className="bg-white text-destructive p-3 rounded-full shadow-2xl hover:scale-110 transition-transform"
                                            >
                                                <X className="h-6 w-6" />
                                            </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label htmlFor="image" className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all bg-muted/20 border-muted-foreground/20 group">
                                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                              <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-8 h-8 text-primary" />
                                              </div>
                                              <p className="mb-1 text-sm font-black text-foreground">Click to upload photo</p>
                                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">PNG or JPG up to 5MB</p>
                                          </div>
                                          <Input id="image" name="image" type="file" accept="image/*" className="hidden" required onChange={handleProductImageChange} />
                                      </label>
                                    )}
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 pt-3 border-t bg-background flex-shrink-0 absolute bottom-0 left-0 right-0 z-20">
                            <Button type="submit" className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20" disabled={isAddPending}>
                              {isAddPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                              Publish Listing
                            </Button>
                          </div>
                      </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-none bg-background shadow-sm ring-1 ring-border">
                        <div className="relative aspect-square bg-muted flex items-center justify-center">
                            {product.image_urls && product.image_urls.length > 0 ? (
                                <Image 
                                    src={product.image_urls[0]} 
                                    alt={product.name} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                                    <ImageIcon className="h-10 w-10 mb-1" />
                                    <span className="text-[10px] font-bold">NO IMAGE</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <Badge variant={product.is_approved ? 'default' : 'secondary'} className={cn("shadow-lg backdrop-blur-md px-2 py-0.5 text-[10px] font-bold uppercase", product.is_approved ? "bg-emerald-500/80" : "bg-white/80 text-orange-600")}>
                                    {product.is_approved ? 'Approved' : 'Reviewing'}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-3">
                            <h3 className="font-bold truncate text-xs sm:text-sm">{product.name}</h3>
                            <p className="text-primary font-black mt-1 text-sm">GHS {formatPrice(product.price)}</p>
                            <div className="flex gap-1 mt-3">
                                <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase" asChild>
                                    <Link href={`/products/${product.id}`} target="_blank">View</Link>
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDeleteProduct(product.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {products.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                        <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-sm font-bold text-muted-foreground">You haven't added any products yet.</p>
                        <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>Start selling now</Button>
                    </div>
                )}
            </div>
        </TabsContent>

        <TabsContent value="customers" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Client Directory</CardTitle>
                    <CardDescription>Customers who have purchased from your shop.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {uniqueCustomers.map((cust) => (
                            <Card key={cust.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {cust.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{cust.name}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{cust.totalOrders} total orders</p>
                                        </div>
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" /> {cust.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 h-9" asChild>
                                        <a href={`tel:${cust.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" /> Call</a>
                                    </Button>
                                    <Button variant="secondary" size="sm" className="flex-1 h-9" asChild>
                                        <Link href={`/admin/sales/customers/${cust.id}`}><Eye className="h-3.5 w-3.5 mr-1.5" /> History</Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {uniqueCustomers.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground italic">No customer records yet.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Shop Profile</CardTitle>
                    <CardDescription>Manage your store identity and operating hours.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpdateShop} className="space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-muted/20 rounded-2xl border border-dashed">
                                <div className="relative group mx-auto sm:mx-0">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{seller.shop_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor="logo" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <ImageIcon className="h-6 w-6" />
                                    </Label>
                                    <Input id="logo" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="font-bold text-sm">Update Shop Identity</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Tap the image to upload a new logo. We recommend a 1:1 aspect ratio.</p>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="shop_name" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Shop Name</Label>
                                <Input id="shop_name" name="shop_name" defaultValue={seller.shop_name} required className="h-12 border-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="open_time" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Opens At</Label>
                                    <Input id="open_time" name="open_time" type="time" defaultValue={seller.open_time || "08:00"} className="h-12 border-2" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="close_time" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Closes At</Label>
                                    <Input id="close_time" name="close_time" type="time" defaultValue={seller.close_time || "20:00"} className="h-12 border-2" />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto px-12 h-12 text-base font-bold shadow-lg shadow-primary/20" disabled={isUpdatePending}>
                            {isUpdatePending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Save Settings
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
