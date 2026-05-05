import { createClient } from '@/lib/supabase/server';
import AdminFeedsPage from './feeds-client-page';

export default async function Page() {
    const supabase = await createClient();
    
    const { data: feeds } = await supabase
        .from('feeds')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: products } = await supabase
        .from('products')
        .select('id, name, image_urls, price')
        .order('name');

    return <AdminFeedsPage initialFeeds={feeds || []} products={products || []} />;
}
