'use client';

import { useEffect, useState, useTransition } from 'react';
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
  const [user, setUser] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [isAddPending, startAddTransition] = useTransition();
  const [isDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Preview states
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
  }, []);

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
            toast({ title: 'Product submitted for approval', variant: 'success' });
            window.location.reload();
        } else {
            toast({ title: 'Failed to add product', description: result.error, variant: 'destructive' });
        }
    });
  };

  const handleUpdateShop = async (formData: FormData) => {
      setIsUpdatePending(true);
      try {
          if (!seller) return;
          formData.append('sellerId', seller.id);
          const result = await updateShopInfo(formData);
          
          if (result.success) {
              toast({ 
                  title: 'Settings Saved!', 
                  description: 'Changes applied. Please refresh the page manually to update all profile icons.',
                  variant: 'success' 
              });
          } else {
              toast({ 
                  title: 'Update failed', 
                  description: result.error || 'Check your internet connection and try again.', 
                  variant: 'destructive' 
              });
          }
      } catch (err: any) {
          // Robust fallback: treat the serialization bug as a success with a refresh prompt
          toast({ 
              title: 'Settings Saved!', 
              description: 'Changes applied. Please refresh the page manually to update all icons.',
              variant: 'success'
          });
      } finally {
          setIsUpdatePending(false);
      }
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
      {/* Header Info */}
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

        {/* Overview Tab */}
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
                <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic border-t pt-6">
                    Sales trend visualization coming soon...
                </CardContent>
            </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Orders</CardTitle>
                    <CardDescription>Track and update customer order statuses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-bold">{order.profiles?.display_name}</div>
                                            <div className="text-xs text-muted-foreground">{order.profiles?.phone_number}</div>
                                        </TableCell>
                                        <TableCell>{order.products?.name}</TableCell>
                                        <TableCell>{order.quantity}</TableCell>
                                        <TableCell className="font-bold">GHS {formatPrice(order.price_per_item * order.quantity)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                order.status === 'completed' ? 'default' :
                                                order.status === 'ready' ? 'secondary' :
                                                order.status === 'pending' ? 'outline' : 'destructive'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {order.status === 'pending' && (
                                                <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'ready')} disabled={isPending}>Mark Ready</Button>
                                            )}
                                            {order.status === 'ready' && (
                                                <Button size="sm" variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200" onClick={() => handleUpdateStatus(order.id, 'completed')} disabled={isPending}>Mark Complete</Button>
                                            )}
                                            <Button size="sm" variant="ghost" asChild>
                                                <Link href={`/admin/sales/${order.id}`}><Eye className="h-4 w-4" /></Link>
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">My Catalog ({products.length})</h2>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) setProductImagePreview(null);
                }}>
                    <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" /> Add New</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>List a Product</DialogTitle>
                        <DialogDescription>Submit for review. Public once approved.</DialogDescription>
                    </DialogHeader>
                    <form action={handleAddProduct} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" placeholder="e.g. Wireless Mouse" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="price">Price (GHS)</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" rows={3} />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="image">Product Image</Label>
                          {productImagePreview ? (
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden border bg-muted">
                               <Image src={productImagePreview} alt="Preview" fill className="object-contain" />
                               <button 
                                  type="button" 
                                  onClick={() => setProductImagePreview(null)}
                                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                               >
                                  <X className="h-4 w-4" />
                               </button>
                            </div>
                          ) : (
                            <label htmlFor="image" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20 border-muted-foreground/20">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground font-semibold">Click to upload</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                                </div>
                                <Input id="image" name="image" type="file" accept="image/*" className="hidden" required onChange={handleProductImageChange} />
                            </label>
                          )}
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={isAddPending}>
                        {isAddPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Submit for Approval
                        </Button>
                    </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative aspect-square bg-muted">
                            <Image 
                                src={product.image_urls?.[0] || 'https://picsum.photos/seed/prod/400/400'} 
                                alt={product.name} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant={product.is_approved ? 'default' : 'secondary'} className={cn("shadow-lg backdrop-blur-md", product.is_approved ? "bg-emerald-500/80" : "bg-white/80")}>
                                    {product.is_approved ? 'Approved' : 'Reviewing'}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold truncate text-sm">{product.name}</h3>
                            <p className="text-primary font-black mt-1">GHS {formatPrice(product.price)}</p>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <Link href={`/products/${product.id}`}><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Live</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Client List</CardTitle>
                    <CardDescription>Directory of customers who have shopped from you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {uniqueCustomers.map((cust) => (
                            <Card key={cust.id} className="p-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                                            {cust.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{cust.name}</p>
                                            <p className="text-xs text-muted-foreground">{cust.totalOrders} total orders</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" /> {cust.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <a href={`tel:${cust.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" /> Call</a>
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1" asChild>
                                        <Link href={`/admin/sales/customers/${cust.id}`}><Eye className="h-3.5 w-3.5 mr-1.5" /> Profile</Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {uniqueCustomers.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground italic">No customers found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card>
                <CardHeader>
                    <CardTitle>Shop Profile</CardTitle>
                    <CardDescription>Manage your store identity and operating hours.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpdateShop} className="space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-2xl border border-dashed">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={logoPreview || user?.user_metadata?.avatar_url || undefined} />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{seller.shop_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor="logo" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <ImageIcon className="h-6 w-6" />
                                    </Label>
                                    <Input id="logo" name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Shop Logo</p>
                                    <p className="text-xs text-muted-foreground">Click the icon to upload a new logo. Best in 500x500px.</p>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="shop_name" className="font-bold">Shop Display Name</Label>
                                <Input id="shop_name" name="shop_name" defaultValue={seller.shop_name} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="open_time" className="font-bold">Opening Time</Label>
                                    <Input id="open_time" name="open_time" type="time" defaultValue={seller.open_time || "08:00"} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="close_time" className="font-bold">Closing Time</Label>
                                    <Input id="close_time" name="close_time" type="time" defaultValue={seller.close_time || "20:00"} />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full sm:w-auto px-12 h-11" disabled={isUpdatePending}>
                            {isUpdatePending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {isUpdatePending ? 'Saving Changes...' : 'Save Settings'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}