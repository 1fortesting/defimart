'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateSellerStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSellers = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('sellers' as any).select('*').order('created_at', { ascending: false });
      setSellers(data || []);
      setLoading(false);
    };

    fetchSellers();
  }, []);

  const handleAction = (sellerId: string, status: 'approved' | 'rejected') => {
    startTransition(async () => {
      try {
        await updateSellerStatus(sellerId, status);
        setSellers(sellers.map(s => s.id === sellerId ? { ...s, status } : s));
        toast({ title: `Seller ${status}` });
      } catch (e) {
        toast({ title: 'Action failed', variant: 'destructive' });
      }
    });
  };

  if (loading) return <div className="p-8 text-center">Loading sellers...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> Seller Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Seller Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-bold">{seller.shop_name}</TableCell>
                  <TableCell>{seller.full_name}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                        <p>{seller.email}</p>
                        <p className="text-muted-foreground">{seller.phone_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      seller.status === 'approved' ? 'success' :
                      seller.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {seller.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {seller.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          onClick={() => handleAction(seller.id, 'approved')}
                          disabled={isPending}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          onClick={() => handleAction(seller.id, 'rejected')}
                          disabled={isPending}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </TableRow>
              ))}
              {sellers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sellers registered yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
