import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import ProductRequestsClientPage from './requests-client-page';

export type ProductRequestWithUser = Tables<'product_requests'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function ProductRequestsPage() {
    const supabase = createClient();
    
    // Fetch requests for 'procurement' OR older requests with no department set
    const { data, error } = await supabase
        .from('product_requests')
        .select('*, profiles(display_name, phone_number)')
        .or('department.eq.procurement,department.is.null')
        .order('created_at', { ascending: false })
        .returns<ProductRequestWithUser[]>();
    
    if (error) {
        console.error("Failed to fetch product requests:", error.message);
    }
    
    return <ProductRequestsClientPage initialRequests={data || []} />;
}
