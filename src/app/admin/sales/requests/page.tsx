import { createClient } from '@/lib/supabase/server';
import { Tables } from '@/types/supabase';
import RequestsClientPage from './requests-client-page';

export type ProductRequestWithUser = Tables<'product_requests'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'phone_number'> | null;
};

export default async function SalesProductRequestsPage() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('product_requests')
        .select('*, profiles(display_name, phone_number)')
        .or('department.eq.sales,department.is.null')
        .order('created_at', { ascending: false })
        .returns<ProductRequestWithUser[]>();
    
    if (error) {
        console.error("Failed to fetch product requests for sales:", error.message);
    }
    
    console.log("Fetched requests for sales:", data);

    return <RequestsClientPage initialRequests={data || []} />;
}
