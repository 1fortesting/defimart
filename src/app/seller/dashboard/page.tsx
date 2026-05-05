'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleShopStatus, addSellerProduct } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Package, Power, Plus, Eye, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = ["Electronics & Gadgets", "Fashion & Apparel", "Home & Kitchen", "Books & Stationery", "Other"];

export default function SellerDashboardPage() {
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isAddPending, startAddTransition] = useTransition();
  const [isDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sellerData } = await supabase.from('sellers' as any).select('*').eq('user_id', user.id).single();
      setSeller(sellerData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      setProducts(productsData || []);
    };

    fetchData();
  }, []);

  const handleToggle = (isOpen: boolean) => {
    startTransition(async () => {
      try {
        await toggleShopStatus(seller.id, isOpen);
        setSeller({ ...seller, is_open: isOpen });
        toast({ title: isOpen ? 'Shop is now OPEN' : 'Shop is now CLOSED', variant: isOpen ? 'success' : 'default' });
      } catch (e) {
        toast({ title: 'Update failed', variant: 'destructive' });
      }
    });
  };

  const handleAddProduct = async (formData: FormData) => {
    startAddTransition(async () => {
        try {
            await addSellerProduct(formData);
            setIsAddDialogOpen(false);
            toast({ title: 'Product submitted for approval' });
            // Refresh logic omitted for brevity, usually router.refresh() handles this
            window.location.reload();
        } catch (e) {
            toast({ title: 'Failed to add product', variant: 'destructive' });
        }
    });
  };

  if (!seller) return null;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Shop Status Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Shop Status</CardTitle>
                <CardDescription>Control your availability to customers.</CardDescription>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg px-4 border">
                <Label htmlFor="shop-toggle" className="font-bold">{seller.is_open ? 'OPEN' : 'CLOSED'}</Label>
                <Switch 
                  id="shop-toggle" 
                  checked={seller.is_open} 
                  onCheckedChange={handleToggle}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{seller.open_time || '08:00'} - {seller.close_time || '20:00'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Power className={seller.is_open ? "text-green-500 h-4 w-4" : "text-muted-foreground h-4 w-4"} />
                    <span>{seller.is_open ? 'Accepting orders' : 'Not accepting orders'}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center h-full">
                <div className="text-center">
                    <p className="text-3xl font-bold">{products.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Products</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold">{products.filter(p => p.is_approved).length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Live</p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Product Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" /> My Products
          </h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Submit a product for review. Once approved, it will be visible in the store.</DialogDescription>
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
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <Input id="image" name="image" type="file" accept="image/*" required />
                </div>
                <Button type="submit" className="w-full" disabled={isAddPending}>
                  {isAddPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  Submit for Approval
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <Image 
                  src={product.image_urls?.[0] || 'https://picsum.photos/seed/prod/400/300'} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={product.is_approved ? 'success' : 'secondary'}>
                    {product.is_approved ? 'Approved' : 'Pending Review'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold truncate">{product.name}</h3>
                <p className="text-primary font-bold">GHS {product.price}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/products/${product.id}`}><Eye className="h-4 w-4 mr-2" /> Preview</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-background">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium">No products yet</p>
                <p className="text-sm text-muted-foreground">Start by adding your first product for review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
